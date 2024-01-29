import { Event } from "nostr-tools";

export function filterTagValue(ev: Event, tag: string) {
  return ev.tags.filter(([t]) => t === tag);
}
