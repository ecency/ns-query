import { Event } from "nostr-tools";

export function findTagValue(
  ev: Event,
  tag: "e" | "p" | "d" | "status",
  condition?: (v: string) => boolean,
) {
  return ev.tags.find(
    ([t]) => t === tag && (condition ? condition(t) : true),
  )?.[1];
}
