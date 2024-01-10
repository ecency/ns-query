import { Kind } from "nostr-tools";
import { useNostrFetchQuery } from "../core";
import { convertEvent } from "../utils/event-converter";

export function useNostrGetUserProfileQuery(pubKey?: string | null) {
  return useNostrFetchQuery(
    ["chats/nostr-get-user-profile", pubKey],
    [
      {
        kinds: [Kind.Metadata],
        authors: [pubKey!!],
      },
    ],
    (events) =>
      events
        .map((event) => convertEvent<Kind.Metadata>(event)!!)
        .filter((profile) => profile!!),
    {
      enabled: !!pubKey,
      refetchOnMount: false,
    },
  );
}

export function useNostrGetUserProfilesQuery(pubKeys: string[]) {
  return useNostrFetchQuery(
    ["chats/nostr-get-user-profile", pubKeys],
    pubKeys.map((user) => ({
      kinds: [Kind.Metadata],
      authors: [user],
    })),
    (events) =>
      events
        .map((event) => convertEvent<Kind.Metadata>(event)!!)
        .filter((profile) => profile!!),
    {
      initialData: [],
      refetchOnMount: false,
      enabled: pubKeys.length > 0,
    },
  );
}
