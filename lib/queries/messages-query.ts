import { InfiniteData, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatQueries } from "./queries";
import {
  Channel,
  DirectContact,
  Message,
  NostrQueries,
  useKeysQuery,
} from "../nostr";
import { useContext } from "react";
import { ChatContext } from "../chat-context-provider";

/**
 * Hook for fetching message for specific contact or channel
 * @note contact list could contain multiple contacts with same name but different private key
 *    it should be handled separately
 */
export function useMessagesQuery(
  currentContact?: DirectContact,
  currentChannel?: Channel,
) {
  const { activeUsername } = useContext(ChatContext);
  const queryClient = useQueryClient();

  const { hasKeys } = useKeysQuery();

  return useQuery<Message[]>(
    [
      ChatQueries.MESSAGES,
      activeUsername,
      currentChannel?.id ?? currentContact?.pubkey,
    ],
    async () => {
      if (!currentContact && !currentChannel) {
        return [];
      }
      const directMessages = queryClient.getQueryData<InfiniteData<Message[]>>([
        NostrQueries.DIRECT_MESSAGES,
        activeUsername,
        currentContact?.pubkey,
      ]);
      const publicMessages = queryClient.getQueryData<InfiniteData<Message[]>>([
        NostrQueries.PUBLIC_MESSAGES,
        activeUsername,
        currentChannel?.id,
      ]);

      let initialMessages: Message[] = [];
      if (!!currentChannel && publicMessages) {
        initialMessages = publicMessages.pages.reduce<Message[]>(
          (acc, page) => [...acc, ...page],
          [],
        );
      } else if (directMessages && currentContact) {
        initialMessages = directMessages.pages.reduce<Message[]>(
          (acc, page) => [...acc, ...page],
          [],
        );
      }

      if (initialMessages.length === 0) {
        return [];
      }

      const pendingMessages = (
        queryClient.getQueryData<Message[]>([
          ChatQueries.MESSAGES,
          activeUsername,
          currentChannel?.id ?? currentContact?.pubkey,
        ]) ?? []
      ).filter(
        (m) => m.sent === 0 && !initialMessages.some((im) => im.id === m.id),
      );
      const failedMessages = (
        queryClient.getQueryData<Message[]>([
          ChatQueries.MESSAGES,
          activeUsername,
          currentChannel?.id ?? currentContact?.pubkey,
        ]) ?? []
      ).filter(
        (m) => m.sent === 2 && !initialMessages.some((im) => im.id === m.id),
      );

      return [...initialMessages, ...failedMessages, ...pendingMessages];
    },
    {
      initialData: [],
      enabled: hasKeys && (!!currentContact || !!currentChannel),
      select: (messages) => messages.sort((a, b) => a.created - b.created),
      refetchInterval: 1000,
    },
  );
}
