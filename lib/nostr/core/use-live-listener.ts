import { Event, Filter } from "nostr-tools";
import { useContext, useEffect, useRef } from "react";
import { NostrContext } from "../nostr-context";
import { useTimeoutFn } from "react-use";

export function useLiveListener<DATA extends object>(
  filters: Filter[],
  dataResolver: (event: Event) => DATA | Promise<DATA>,
  emitter: (data: DATA) => void,
  options: {
    enabled: boolean;
    disabledSince?: boolean;
  },
) {
  const { pool, readRelays, writeRelays, sleepMode } = useContext(NostrContext);
  const sinceRef = useRef<number>(Math.floor(new Date().getTime() / 1000));

  const [isReady, cancel, reset] = useTimeoutFn(() => {
    const nextFilters = sinceRef.current
      ? (filters as Filter[]).map((f) => ({
          ...f,
          ...(options.disabledSince ? {} : { since: sinceRef.current }),
        }))
      : filters;
    const subInfo = pool?.sub(readRelays, nextFilters);
    subInfo?.on("event", (event: Event) => processEvent(event));
    subInfo?.on("eose", () => {
      subInfo.unsub();
      reset();
    });
  }, 10000);

  useEffect(() => {
    if (!options.enabled || filters.length === 0) {
      return;
    }

    if (sleepMode) {
      console.debug("[ns-query] Initiated connections teardown by timeout");
      cancel();
      pool?.close([...readRelays, ...writeRelays]);
    } else {
      console.debug("[ns-query] Reconnected");
      reset();
    }
  }, [sleepMode, options, filters]);

  const processEvent = async (event: Event) => {
    const data = await dataResolver(event);
    sinceRef.current =
      "created" in data
        ? (data.created as number) + 1
        : Math.floor(new Date().getTime() / 1000);
    emitter(data);
  };
}
