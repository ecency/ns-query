import { Event, Filter, Kind, SimplePool } from "vicev-nostr-tools";

export async function listenWhileFinish(
  pool: SimplePool | undefined,
  readRelays: string[],
  kinds: Kind[],
  pub: string,
  filters?: Filter[],
) {
  return new Promise<Event[]>((resolve) => {
    const nextFilters = filters ?? [
      {
        kinds,
        authors: [pub],
      },
    ];
    const subInfo = pool?.sub(readRelays, nextFilters);
    const events: Event[] = [];
    subInfo?.on("event", (event: Event) => {
      events.push(event);
    });
    subInfo?.on("eose", () => {
      resolve(
        events
          .reduce<Event[]>(
            (acc, event) => [
              ...acc,
              ...(acc.some((e) => e.id === event.id) ? [] : [event]),
            ],
            [],
          )
          .sort((a, b) => b.created_at - a.created_at),
      );
      subInfo?.unsub();
    });
  });
}
