import { QueryKey, useQuery } from "@tanstack/react-query";
import { Event, Filter, Kind } from "nostr-tools";
import { useContext } from "react";
import { NostrContext } from "../nostr-context";
import { UseQueryOptions } from "@tanstack/react-query/src/types";
import { listenWhileFinish } from "../utils";
import { useKeysQuery } from "./keys-query";

export function useNostrFetchQuery<DATA>(
  key: QueryKey,
  kindsOrFilters: (Kind | Filter)[],
  dataResolver: (events: Event[]) => DATA | Promise<DATA>,
  queryOptions?: UseQueryOptions<DATA>,
) {
  const { pool, readRelays } = useContext(NostrContext);
  const { publicKey } = useKeysQuery();

  return useQuery(
    key,
    async () => {
      const kinds = kindsOrFilters.every((item) => typeof item === "number")
        ? (kindsOrFilters as Kind[])
        : [];
      const filters = kindsOrFilters.every((item) => typeof item === "object")
        ? (kindsOrFilters as Filter[])
        : undefined;
      const events = await listenWhileFinish(
        pool,
        readRelays,
        kinds,
        publicKey!!,
        filters,
      );
      return dataResolver(events);
    },
    queryOptions,
  );
}
