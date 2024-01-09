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
        .filter((channel) => !!channel) as Channel[],
    {
      enabled: (activeUserNostrProfiles?.[0]?.joinedChannels?.length ?? 0) > 0,
      refetchOnMount: false,
    },
  );
}
