import { ChatQueries } from "./queries";
import {
  Channel,
  useKeysQuery,
  useNostrFetchQuery,
  useNostrGetUserProfileQuery,
} from "../nostr";
import { Kind } from "nostr-tools";
import { convertEvent } from "../nostr/utils/event-converter";
import { useContext, useMemo } from "react";
import { ChatContext } from "../chat-context-provider";

export function useChannelsQuery() {
  const { activeUsername } = useContext(ChatContext);
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
    [ChatQueries.JOINED_CHANNELS, activeUsername],
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
      refetchOnMount: false,
    },
  );
  return useMemo(
    () => ({
      data: [...(createdChannels ?? []), ...(joinedChannels ?? [])],
    }),
    [createdChannels, joinedChannels],
  );
}
