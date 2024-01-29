import { Event } from "nostr-tools";
import { findTagValue } from "./find-tag-value";
import { extractLatestEventsByTagComparing } from "./extract-latest-events-by-tag-comparing";

export function convertHiddenMessagesEvents(
  events: Event[],
  channelId: string,
  joinedCommunityTeamKeys: string[] = [],
) {
  return extractLatestEventsByTagComparing(events, "e", channelId)
    .filter((e) => joinedCommunityTeamKeys.includes(e.pubkey))
    .map((e) => [
      findTagValue(e, "e", (tag) => tag !== channelId),
      findTagValue(e, "status"),
    ])
    .filter(([eventId, status]) => !!eventId && status === "0")
    .map(([id]) => id);
}
