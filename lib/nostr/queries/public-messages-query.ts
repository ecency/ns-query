import { Kind } from "nostr-tools";
import { convertEvent } from "../utils/event-converter";
import { NostrQueries } from "./queries";
import { Channel, Message } from "../types";
import { useNostrInfiniteFetchQuery } from "../core/nostr-infinite-fetch-query";
import { useContext } from "react";
import { ChatContext } from "../../chat-context-provider";
import { useNostrFetchMutation } from "../core";
import { ChatQueries } from "../../queries";
import { convertHiddenMessagesEvents, convertMutedUsersEvents } from "../utils";

/**
 * Use this query to retrieve filtered channel messages
 * @param channel Current channel
 * @param joinedCommunityTeamKeys Represents list of public keys of community members which may hide messages or block users
 */
export function usePublicMessagesQuery(
  channel?: Channel,
  joinedCommunityTeamKeys: string[] = [],
) {
  const { activeUsername } = useContext(ChatContext);
  const { mutateAsync: fetchHiddenMessages } = useNostrFetchMutation(
    [ChatQueries.HIDDEN_CHANNEL_MESSAGES, activeUsername, channel?.id],
    [],
  );
  const { mutateAsync: fetchBlockedUsers } = useNostrFetchMutation(
    [ChatQueries.BLOCKED_USERS, activeUsername, channel?.id],
    [],
  );

  return useNostrInfiniteFetchQuery<Message[]>(
    [NostrQueries.PUBLIC_MESSAGES, activeUsername, channel?.id],
    [
      {
        kinds: [Kind.ChannelMessage],
        "#e": [channel?.id ?? ""],
        limit: 50,
      },
    ],
    async (events) => {
      // 1. Fetch messages and convert them
      let messagesPage = events
        .map((event) => convertEvent(event))
        .filter((message) => !!message) as Message[];

      // 2. Fetch blocked users and filter only by community team members
      //    note: same behavior as in hidden messages
      const blockedUsersEvents = await fetchBlockedUsers(
        Array.from(new Set(messagesPage.map((m) => m.creator)).values()).map(
          (creator) => ({
            kinds: [Kind.ChannelMuteUser],
            "#p": [creator],
            "#e": [channel?.id ?? ""],
          }),
        ),
      );
      const blockedUsersIds = convertMutedUsersEvents(
        blockedUsersEvents,
        joinedCommunityTeamKeys,
      );

      console.debug(
        "[ns-query] Hidden users by community team IDs are",
        channel,
        blockedUsersIds,
      );

      // 2.1 Filter out messages page by hidden users
      //     note: it should be done first to decrease events count for hidden messages fetching
      messagesPage = messagesPage.filter(
        (m) => !blockedUsersIds.includes(m.creator),
      );

      // 3. Fetch hidden messages and filter by only community team members
      //    note: Since any Nostr user can publish hidden message event We have to make sure that it was by community team
      const hiddenMessagesEvents = await fetchHiddenMessages(
        messagesPage.map((m) => ({
          kinds: [Kind.ChannelHideMessage],
          "#e": [m.id],
        })),
      );

      // 3. Extract message IDs and filter hidden messages event by creator
      const hiddenMessagesIds = convertHiddenMessagesEvents(
        hiddenMessagesEvents,
        channel!.id,
        joinedCommunityTeamKeys,
      );
      console.debug(
        "[ns-query] Hidden messages by community team are",
        channel,
        hiddenMessagesIds,
      );

      return messagesPage.filter((m) => !hiddenMessagesIds.includes(m.id));
    },
    {
      enabled: !!channel?.id,
      initialData: { pages: [[]], pageParams: [] },
      getNextPageParam: (lastPage) =>
        lastPage?.sort((a, b) => a.created - b.created)?.[0]?.created,
      refetchOnMount: false,
    },
  );
}
