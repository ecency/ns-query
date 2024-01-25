import {
  Channel,
  DirectContact,
  useDirectMessagesQuery,
  usePublicMessagesQuery,
} from "../nostr";
import { useEffect, useMemo } from "react";
import { useMessagesQuery } from "./messages-query";
import { useJoinedCommunityTeamQuery } from "./joined-community-team-query";
import { KindOfCommunity } from "../types";

/**
 *
 * @param contact Current direct contact
 * @param channel Current channel
 * @param community Current channel's community
 * @note As for ecency-vision this query runs initial messages fetching. If your application don't follow this rule
 *       make sure that messages queries was fetched manually
 */
export function useLastMessageQuery(
  contact?: DirectContact,
  channel?: Channel,
  community?: KindOfCommunity,
) {
  const { data: joinedCommunityTeamKeys, isSuccess } =
    useJoinedCommunityTeamQuery(community);

  const { refetch: refetchDirectMessages } = useDirectMessagesQuery(contact);
  const { refetch: refetchPublicMessages } = usePublicMessagesQuery(
    channel,
    joinedCommunityTeamKeys,
  );
  const { data: messages } = useMessagesQuery(contact, channel);

  useEffect(() => {
    refetchDirectMessages();
  }, [contact]);

  useEffect(() => {
    if (isSuccess) {
      refetchPublicMessages();
    }
  }, [channel, joinedCommunityTeamKeys, isSuccess]);

  return useMemo(() => messages[messages.length - 1], [messages]);
}
