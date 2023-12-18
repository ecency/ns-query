import { Event, Filter } from "nostr-tools";
import { useContext, useEffect, useRef } from "react";
import { NostrContext } from "../nostr-context";

export function useLiveListener<DATA extends object>(
  filters: Filter[],
  dataResolver: (event: Event) => DATA | Promise<DATA>,
  emitter: (data: DATA) => void,
  options: {
    enabled: boolean;
  },
) {
  const { pool, readRelays } = useContext(NostrContext);
  const timeoutRef = useRef<any>();
  const sinceRef = useRef<number>(Math.floor(new Date().getTime() / 1000));

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
        run();
      });
    }, 500);
  };

  const processEvent = async (event: Event) => {
    const data = await dataResolver(event);
    sinceRef.current =
      "created" in data
        ? (data.created as number) + 1
        : Math.floor(new Date().getTime() / 1000);
    emitter(data);
  };
}
