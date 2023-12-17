import { Event, Filter } from "nostr-tools";
import { useContext, useEffect } from "react";
import { NostrContext } from "../nostr-context";

export function useLiveListener<DATA>(
  filters: Filter[],
  dataResolver: (event: Event) => DATA | Promise<DATA>,
  emitter: (data: DATA) => void,
  options: {
    enabled: boolean;
  },
) {
  const { pool, readRelays } = useContext(NostrContext);

  useEffect(() => {
    if (!options.enabled) {
      return;
    }

    const subInfo = pool?.sub(readRelays, filters);
    subInfo?.on("event", (event: Event) => processEvent(event));
    subInfo?.on("eose", () => subInfo.unsub());
  }, [options]);

  const processEvent = async (event: Event) => {
    const data = await dataResolver(event);
    emitter(data);
  };
}
