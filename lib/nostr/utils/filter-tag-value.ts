import { Event } from "vicev-nostr-tools";

export function filterTagValue(ev: Event, tag: "e" | "p" | "d") {
  return ev.tags.filter(([t]) => t === tag);
}
