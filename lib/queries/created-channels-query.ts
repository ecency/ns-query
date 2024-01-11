import { Channel, useKeysQuery, useNostrFetchQuery } from "../nostr";
import { ChatQueries } from "./queries";
import { Kind } from "nostr-tools";
import { convertEvent } from "../nostr/utils/event-converter";
import { useContext } from "react";
import { ChatContext } from "../chat-context-provider";

export function useCreatedChannelsQuery() {
  const { activeUsername } = useContext(ChatContext);
  const { hasKeys } = useKeysQuery();

  return useNostrFetchQuery<Channel[]>(
    [ChatQueries.CREATED_CHANNELS, activeUsername],
    [Kind.ChannelCreation],
    (events) =>
      events
        .map((event) => convertEvent<Kind.ChannelCreation>(event))
        .filter((channel) => !!channel) as Channel[],
    {
      initialData: [],
      enabled: hasKeys,
      refetchOnMount: false,
    },
  );
}
