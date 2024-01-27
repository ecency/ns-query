import { Event } from "nostr-tools";
import { findTagValue } from "./find-tag-value";

/**
 * Since moderation team may block and unblock same user multiple time then We have to use latest one action
 * @param events
 */
export function extractLatestMutedUsersEvents(events: Event[]) {
  return events
    .sort((a, b) => b.created_at - a.created_at)
    .reduce<Event[]>((acc, event) => {
      const hasAlready = acc.some(
        (ae) => findTagValue(ae, "p") === findTagValue(event, "p"),
      );
      if (hasAlready) {
        return acc;
      }
      return [...acc, event];
    }, []);
}
