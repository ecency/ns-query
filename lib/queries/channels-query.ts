import { ChatQueries } from "./queries";
import {
  Channel,
  PublicMessage,
  useKeysQuery,
  useNostrFetchQuery,
} from "../nostr";
import { Kind } from "nostr-tools";
import { convertEvent } from "../nostr/utils/event-converter";
import { useContext, useEffect, useMemo } from "react";
import { ChatContext } from "../chat-context-provider";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useChannelsQuery() {
  const { activeUsername } = useContext(ChatContext);
  const queryClient = useQueryClient();

  const { hasKeys, publicKey } = useKeysQuery();

  const { data: createdChannels } = useNostrFetchQuery<Channel[]>(
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
  const { data: allChannelMessages } = useNostrFetchQuery(
    [ChatQueries.CHANNELS_MESSAGES, activeUsername],
    [
      {
        kinds: [Kind.ChannelMessage],
        authors: [publicKey!!],
      },
    ],
    (events) =>
      events
        .map((event) => convertEvent<Kind.ChannelMessage>(event))
        .filter((channel) => !!channel) as PublicMessage[],
    {
      enabled: !!publicKey,
    },
  );

  const channelIds = useMemo(
    () =>
      Array.from(
        new Set(
          allChannelMessages?.map((message) => message.root) ?? [],
        ).values(),
      ),
    [allChannelMessages],
  );
  const { data: joinedChannels } = useNostrFetchQuery(
    [ChatQueries.JOINED_CHANNELS],
    channelIds.map((id) => ({
      kinds: [Kind.ChannelCreation],
      ids: [id],
    })),
    (events) =>
      events
        .map((event) => convertEvent<Kind.ChannelCreation>(event))
        .filter((channel) => !!channel) as Channel[],
    {
      enabled: channelIds.length > 0,
    },
  );

  useEffect(() => {
    queryClient.setQueryData(
      [ChatQueries.CHANNELS, activeUsername],
      [...(createdChannels ?? []), ...(joinedChannels ?? [])],
    );
    queryClient.invalidateQueries([ChatQueries.CHANNELS, activeUsername]);
  }, [createdChannels, joinedChannels]);

  return useQuery([ChatQueries.CHANNELS, activeUsername], () =>
    queryClient.getQueryData<Channel[]>([ChatQueries.CHANNELS, activeUsername]),
  );
}
