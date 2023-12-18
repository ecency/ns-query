import { Kind } from "nostr-tools";
import { convertEvent } from "../utils/event-converter";
import { NostrQueries } from "./queries";
import { Channel, Message } from "../types";
import { useNostrInfiniteFetchQuery } from "../core/nostr-infinite-fetch-query";

export function usePublicMessagesQuery(channel?: Channel) {
  return useNostrInfiniteFetchQuery<Message[]>(
    [NostrQueries.PUBLIC_MESSAGES],
    [
      {
        kinds: [Kind.ChannelMessage],
        "#e": [channel?.id ?? ""],
        limit: 50,
      },
    ],
    (events) =>
      events
        .map((event) => convertEvent(event))
        .filter((message) => !!message) as Message[],
    {
      enabled: !!channel?.id,
      initialData: { pages: [[]], pageParams: [] },
      getNextPageParam: (lastPage) => lastPage?.[lastPage?.length - 1]?.created,
    },
  );
}
