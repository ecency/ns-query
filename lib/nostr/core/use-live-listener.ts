import { Event, Filter } from "nostr-tools";
import { useContext, useEffect, useRef } from "react";
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
  const timeoutRef = useRef<any>();
  const sinceRef = useRef<number>(new Date().getTime());

  useEffect(() => {
    if (!options.enabled) {
      return;
    }

    run();
  }, [options]);

  const run = () => {
    clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const nextFilters = sinceRef.current
        ? filters.map((f) => ({
            ...f,
            since: sinceRef.current,
          }))
        : filters;
      const subInfo = pool?.sub(readRelays, nextFilters);
      subInfo?.on("event", (event: Event) => processEvent(event));
      subInfo?.on("eose", () => {
        subInfo.unsub();
        sinceRef.current = new Date().getTime() / 1000;
        run();
      });
    }, 500);
  };

  const processEvent = async (event: Event) => {
    const data = await dataResolver(event);
    emitter(data);
  };
}
