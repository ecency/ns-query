import { Kind } from "nostr-tools";
import { convertEvent } from "../utils/event-converter";
import { NostrQueries } from "./queries";
import { Channel, Message } from "../types";
import { useNostrInfiniteFetchQuery } from "../core/nostr-infinite-fetch-query";
import { useContext } from "react";
import { ChatContext } from "../../chat-context-provider";

export function usePublicMessagesQuery(channel?: Channel) {
  const { activeUsername } = useContext(ChatContext);

  return useNostrInfiniteFetchQuery<Message[]>(
    [NostrQueries.PUBLIC_MESSAGES, activeUsername, channel?.id],
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
      refetchOnMount: false,
    },
  );
}
