import { ChatQueries } from "./queries";
import { useContext, useEffect } from "react";
import { ChatContext } from "../chat-context-provider";
import { Channel, Message, useNostrFetchQuery } from "../nostr";
import { Kind } from "nostr-tools";
import { convertHiddenMessagesEvents } from "../nostr/utils";
import { useJoinedCommunityTeamQuery } from "./joined-community-team-query";
import { KindOfCommunity } from "../types";
import { convertEvent } from "../nostr/utils/event-converter";

export function useChannelHiddenMessagesQuery(
  channel?: Channel,
  community?: KindOfCommunity,
) {
  const { activeUsername } = useContext(ChatContext);
  const { data: joinedCommunityTeamKeys, isSuccess } =
    useJoinedCommunityTeamQuery(community);

  const query = useNostrFetchQuery(
    [ChatQueries.HIDDEN_CHANNEL_MESSAGES, activeUsername, channel?.id],
    [
      {
        kinds: [Kind.ChannelHideMessage],
        "#e": [channel?.id ?? ""],
      },
    ],
    (events) =>
      convertHiddenMessagesEvents(events, channel!.id, joinedCommunityTeamKeys),
    {
      enabled: !!channel?.id,
      refetchOnMount: false,
    },
  );
  const messagesQuery = useNostrFetchQuery<Message[]>(
    [
      ChatQueries.HIDDEN_CHANNEL_MESSAGES_INSTANCES,
      activeUsername,
      channel?.id,
    ],
    (query.data ?? []).map((id) => ({
      kinds: [Kind.ChannelMessage],
      ids: [id ?? ""],
      limit: 50,
    })),
    (events) =>
      events.map((e) => convertEvent<Kind.ChannelMessage>(e)) as Message[],
    {
      enabled: (query.data?.length ?? 0) > 0,
      refetchOnMount: false,
    },
  );

  useEffect(() => {
    if (isSuccess) {
      query.refetch();
    }
  }, [channel, joinedCommunityTeamKeys, isSuccess]);

  useEffect(() => {
    if (query.data) {
      messagesQuery.refetch();
    }
  }, [query.data]);

  return messagesQuery;
}
