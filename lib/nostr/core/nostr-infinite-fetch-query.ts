import {
  DefinedInitialDataInfiniteOptions,
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { Event, Filter } from "nostr-tools";
import { listenWhileFinish } from "../utils";
import { useContext } from "react";
import { NostrContext } from "../nostr-context";
import { useKeysQuery } from "./keys-query";

export function useNostrInfiniteFetchQuery<DATA>(
  key: QueryKey,
  filters: Filter[],
  dataResolver: (events: Event[]) => DATA | Promise<DATA>,
  queryOptions: Omit<
    DefinedInitialDataInfiniteOptions<
      DATA,
      Error,
      InfiniteData<DATA>,
      QueryKey,
      number | undefined
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { pool, readRelays } = useContext(NostrContext);
  const { publicKey } = useKeysQuery();

  // page param is since timestamp
  return useInfiniteQuery({
    ...queryOptions,
    queryKey: key,
    queryFn: async ({ pageParam }) => {
      const events = await listenWhileFinish(
        pool,
        readRelays,
        [],
        publicKey!!,
        filters.map((f) => ({
          ...f,
          ...(pageParam ? { until: pageParam - 1 } : {}),
        })),
      );
      return dataResolver(events);
    },
  });
}
