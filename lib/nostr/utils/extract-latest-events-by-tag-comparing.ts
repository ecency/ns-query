import { Event } from "nostr-tools";
import { findTagValue } from "./find-tag-value";

/**
 * Since moderation team may generate multiple events then We have to use latest one action
 * @param events
 * @param tag
 * @param excludeTagValue
 */
export function extractLatestEventsByTagComparing(
  events: Event[],
  tag: Parameters<typeof findTagValue>[1],
  excludeTagValue?: string,
) {
  return events
    .sort((a, b) => b.created_at - a.created_at)
    .reduce<Event[]>((acc, event) => {
      const hasAlready = acc.some(
        (ae) =>
          findTagValue(ae, tag) === findTagValue(event, tag) &&
          (excludeTagValue ? findTagValue(ae, tag) !== excludeTagValue : true),
      );
      if (hasAlready) {
        return acc;
      }
      return [...acc, event];
    }, []);
}
