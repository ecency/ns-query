import { Event } from "nostr-tools";
import { findTagValue } from "./find-tag-value";
import { extractLatestMutedUsersEvents } from "./extract-latest-muted-users-events";

/**
 * Convert all muted users events filtering by only moderation team and latest events
 * @param events
 * @param joinedCommunityTeamKeys
 */
export function convertMutedUsersEvents(
  events: Event[],
  joinedCommunityTeamKeys: string[] = [],
) {
  return extractLatestMutedUsersEvents(events)
    .filter((e) => joinedCommunityTeamKeys.includes(e.pubkey))
    .map((e) => [findTagValue(e, "p"), findTagValue(e, "status")])
    .filter(([pubkey, status]) => !!pubkey && status === "0")
    .map(([pubkey]) => pubkey) as string[];
}
