import { Event } from "nostr-tools";
import { findTagValue } from "./find-tag-value";
import { extractLatestEventsByTagComparing } from "./extract-latest-events-by-tag-comparing";

/**
 * Convert all muted users events filtering by only moderation team and latest events
 * @param events
 * @param joinedCommunityTeamKeys
 */
export function convertMutedUsersEvents(
  events: Event[],
  joinedCommunityTeamKeys: string[] = [],
) {
  return extractLatestEventsByTagComparing(events, "p")
    .filter((e) => joinedCommunityTeamKeys.includes(e.pubkey))
    .map((e) => [findTagValue(e, "p"), findTagValue(e, "status")])
    .filter(([pubkey, status]) => !!pubkey && status === "0")
    .map(([pubkey]) => pubkey) as string[];
}
