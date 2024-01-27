import { ChatQueries } from "./queries";
import { useContext, useEffect } from "react";
import { ChatContext } from "../chat-context-provider";
import { Channel, useNostrFetchQuery } from "../nostr";
import { Kind } from "nostr-tools";
import { convertMutedUsersEvents } from "../nostr/utils";
import { useJoinedCommunityTeamQuery } from "./joined-community-team-query";
import { KindOfCommunity } from "../types";

export function useChannelMutedUsersQuery(
  channel?: Channel,
  community?: KindOfCommunity,
) {
  const { activeUsername } = useContext(ChatContext);
  const { data: joinedCommunityTeamKeys, isSuccess } =
    useJoinedCommunityTeamQuery(community);

  const query = useNostrFetchQuery(
    [ChatQueries.BLOCKED_USERS, activeUsername, channel?.id],
    [
      {
        kinds: [Kind.ChannelMuteUser],
        "#e": [channel?.id ?? ""],
      },
    ],
    (events) => convertMutedUsersEvents(events, joinedCommunityTeamKeys),
    {
      enabled: !!channel?.id,
      refetchOnMount: false,
    },
  );

  useEffect(() => {
    if (isSuccess) {
      query.refetch();
    }
  }, [channel, joinedCommunityTeamKeys, isSuccess]);

  return query;
}
