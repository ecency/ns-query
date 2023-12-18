import { ChatQueries } from "./queries";
import {
  Channel,
  useKeysQuery,
  useNostrFetchQuery,
  useNostrGetUserProfileQuery,
} from "../nostr";
import { Kind } from "nostr-tools";
import { convertEvent } from "../nostr/utils/event-converter";
import { useContext, useEffect } from "react";
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
  const { data: activeUserNostrProfiles } =
    useNostrGetUserProfileQuery(publicKey);
  const { data: joinedChannels } = useNostrFetchQuery(
    [ChatQueries.JOINED_CHANNELS],
    activeUserNostrProfiles?.[0]?.joinedChannels?.map((id) => ({
      kinds: [Kind.ChannelCreation],
      ids: [id],
    })) ?? [],
    (events) =>
      events
        .map((event) => convertEvent<Kind.ChannelCreation>(event))
        .filter((channel) => !!channel) as Channel[],
    {
      enabled: (activeUserNostrProfiles?.[0]?.joinedChannels?.length ?? 0) > 0,
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
