import { Event } from "nostr-tools";

export function findTagValue(ev: Event, tag: "e" | "p" | "d") {
  return ev.tags.find(([t]) => t === tag)?.[1];
}
