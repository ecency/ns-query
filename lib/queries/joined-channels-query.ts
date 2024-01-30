import {
  Channel,
  useKeysQuery,
  useNostrFetchQuery,
  useNostrGetUserProfileQuery,
} from "../nostr";
import { ChatQueries } from "./queries";
import { Kind } from "nostr-tools";
import { convertEvent } from "../nostr/utils/event-converter";
import { useContext } from "react";
import { ChatContext } from "../chat-context-provider";

/**
 * This query represents real joined communities list in Nostr
 *    because joined channel list could contain computed values
 */
export function useOriginalJoinedChannelsQuery() {
  const { activeUsername } = useContext(ChatContext);
  const { publicKey } = useKeysQuery();

  const { data: activeUserNostrProfiles } =
    useNostrGetUserProfileQuery(publicKey);

  return useNostrFetchQuery(
    [ChatQueries.ORIGINAL_JOINED_CHANNELS, activeUsername],
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
}

export function useJoinedChannelsQuery() {
  const { activeUsername } = useContext(ChatContext);
  const { publicKey } = useKeysQuery();

  const { data: activeUserNostrProfiles } =
    useNostrGetUserProfileQuery(publicKey);

  return useNostrFetchQuery(
    [ChatQueries.JOINED_CHANNELS, activeUsername],
    activeUserNostrProfiles?.[0]?.joinedChannels?.map((id) => ({
      kinds: [Kind.ChannelCreation],
      ids: [id],
    })) ?? [],
    (events) =>
      events
        .map((event) => convertEvent<Kind.ChannelCreation>(event))
        .filter((channel) => !!channel)
        .reduce<Channel[]>(
          (acc, channel) =>
            acc.every((ac) => ac.id !== channel?.id)
              ? [...acc, channel as Channel]
              : acc,
          [],
        ),
    {
      enabled: (activeUserNostrProfiles?.[0]?.joinedChannels?.length ?? 0) > 0,
      refetchOnMount: false,
    },
  );
}
