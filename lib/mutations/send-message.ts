import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { ChatContext } from "../chat-context-provider";
import {
  Channel,
  DirectContact,
  useKeysQuery,
  useNostrSendDirectMessage,
  useNostrSendPublicMessage,
} from "../nostr";
import { useAddDirectContact } from "./add-direct-contact";
import { ChatQueries, useMessagesQuery } from "../queries";
import { PublishNostrError } from "../nostr/errors";
import { convertEvent } from "../nostr/utils/event-converter";
import { Kind } from "nostr-tools";
import { isCommunity } from "../utils";

export function useSendMessage(
  currentChannel?: Channel,
  currentContact?: DirectContact,
  onSuccess?: () => void,
) {
  const queryClient = useQueryClient();

  const { receiverPubKey } = useContext(ChatContext);
  const { privateKey, publicKey } = useKeysQuery();
  const { data: messages } = useMessagesQuery(
    currentChannel?.communityName ?? currentContact?.name,
    currentChannel?.id ?? currentContact?.pubkey,
  );

  const { mutateAsync: sendDirectMessage } = useNostrSendDirectMessage(
    privateKey!!,
    receiverPubKey,
    undefined,
  );
  const { mutateAsync: sendPublicMessage } = useNostrSendPublicMessage(
    currentChannel?.id,
    undefined,
  );
  const { mutateAsync: addDirectContact } = useAddDirectContact();

  return useMutation(
    ["chats/send-message"],
    async (message: string) => {
      if (!message || message.includes("Uploading")) {
        throw new Error(
          "[Chat][SendMessage] – empty message or has uploading file",
        );
      }

      if (!currentChannel && isCommunity(currentContact?.name)) {
        throw new Error(
          "[Chat][SendMessage] – provided user is community but channel not found",
        );
      }

      // Add user to direct contacts if it's not there yet
      // E.g. if user opened chat room directly from the address bar
      if (currentContact) {
        addDirectContact(currentContact);
      }

      if (currentChannel) {
        return sendPublicMessage({ message });
      } else if (currentContact) {
        return sendDirectMessage(message);
      } else {
        throw new Error("[Chat][SendMessage] – no receiver");
      }
    },
    {
      onSuccess: (message) => {
        message.sent = 0;
        queryClient.setQueryData(
          [
            ChatQueries.MESSAGES,
            currentChannel?.communityName ?? currentContact?.name,
            currentChannel?.id ?? currentContact?.pubkey,
          ],
          [...messages, message],
        );
        onSuccess?.();
      },
      onError: async (error: PublishNostrError | Error) => {
        if ("event" in error) {
          const message = await convertEvent<
            Kind.EncryptedDirectMessage | Kind.ChannelMessage
          >(error.event, publicKey!!, privateKey!!)!!;
          message.sent = 2;
          queryClient.setQueryData(
            [
              ChatQueries.MESSAGES,
              currentChannel?.communityName ?? currentContact?.name,
              currentChannel?.id ?? currentContact?.pubkey,
            ],
            [...messages, message],
          );
        }
      },
    },
  );
}
