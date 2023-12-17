import {
  QueryKey,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
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
  queryOptions?: UseInfiniteQueryOptions<DATA>,
) {
  const { pool, readRelays } = useContext(NostrContext);
  const { publicKey } = useKeysQuery();

  // page param is since timestamp
  return useInfiniteQuery(
    key,
    async ({ pageParam }) => {
      const events = await listenWhileFinish(
        pool,
        readRelays,
        [],
        publicKey!!,
        filters.map((f) => ({
          ...f,
          ...(pageParam ? { since: pageParam } : {}),
        })),
      );
      return dataResolver(events);
    },
    queryOptions,
  );
}
