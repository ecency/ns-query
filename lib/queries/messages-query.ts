import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDirectContactsQuery } from "./direct-contacts-query";
import { useMemo } from "react";
import { ChatQueries } from "./queries";
import { useChannelsQuery } from "./channels-query";
import {
  Message,
  NostrQueries,
  useKeysQuery,
  usePublicMessagesQuery,
} from "../nostr";

/**
 * Hook for fetching message for specific contact or channel
 * @note contact list could contain multiple contacts with same name but different private key
 *    it should be handled separately
 * @param username – username from the URL or selecting from sidebar
 * @param pubKeyOrID – public key or ID of channel
 */
export function useMessagesQuery(username?: string, pubKeyOrID?: string) {
  const queryClient = useQueryClient();

  const { hasKeys } = useKeysQuery();
  const { data: directContacts } = useDirectContactsQuery();
  const { data: channels } = useChannelsQuery();

  usePublicMessagesQuery(channels ?? []);

  const currentChannel = useMemo(
    () =>
      channels?.find(
        (channel) =>
          channel.communityName === username && channel.id === pubKeyOrID,
      ),
    [channels, username],
  );
  const currentContact = useMemo(
    () =>
      directContacts?.find(
        (c) => c.name === username && c.pubkey === pubKeyOrID,
      ) ??
      (!!username && !!pubKeyOrID
        ? {
            name: username,
            pubkey: pubKeyOrID,
          }
        : undefined),
    [directContacts, username],
  );

  return useQuery<Message[]>(
    [ChatQueries.MESSAGES, username, pubKeyOrID],
    async () => {
      if (!username) {
        return [];
      }

      let initialMessages: Message[];
      if (!!currentChannel) {
        initialMessages =
          queryClient
            .getQueryData<Message[]>([NostrQueries.PUBLIC_MESSAGES])
            ?.filter((i) => i.root === currentChannel.id) ?? [];
      } else {
        initialMessages =
          queryClient
            .getQueryData<Message[]>([NostrQueries.DIRECT_MESSAGES])
            ?.filter((i) =>
              "peer" in i
                ? i.peer === currentContact?.pubkey
                : i.root === currentContact?.pubkey,
            ) ?? [];
      }
      const pendingMessages = (
        queryClient.getQueryData<Message[]>([ChatQueries.MESSAGES, username]) ??
        []
      ).filter(
        (m) => m.sent === 0 && !initialMessages.some((im) => im.id === m.id),
      );
      const failedMessages = (
        queryClient.getQueryData<Message[]>([ChatQueries.MESSAGES, username]) ??
        []
      ).filter(
        (m) => m.sent === 2 && !initialMessages.some((im) => im.id === m.id),
      );

      return [...initialMessages, ...failedMessages, ...pendingMessages];
    },
    {
      initialData: [],
      enabled: hasKeys && (!!currentContact || !!currentChannel),
      select: (messages) => {
        if (currentChannel) {
          return messages
            .filter(
              (message) =>
                !currentChannel?.hiddenMessageIds?.includes(message.id),
            )
            .sort((a, b) => a.created - b.created);
        }
        return messages.sort((a, b) => a.created - b.created);
      },
      refetchInterval: 3000,
    },
  );
}
