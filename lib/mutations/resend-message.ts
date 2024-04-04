import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { ChatContext } from "../chat-context-provider";
import {
  Channel,
  DirectContact,
  Message,
  useKeysQuery,
  useNostrSendDirectMessage,
  useNostrSendPublicMessage,
} from "../nostr";
import { ChatQueries, useMessagesQuery } from "../queries";
import { PublishNostrError } from "../nostr/errors";
import { convertEvent } from "../nostr/utils/event-converter";
import { isCommunity } from "../utils";
import { Kind } from "nostr-tools";

export function useResendMessage(
  currentChannel?: Channel,
  currentContact?: DirectContact,
  onSuccess?: () => void,
) {
  const queryClient = useQueryClient();

  const { receiverPubKey, activeUsername } = useContext(ChatContext);
  const { privateKey, publicKey } = useKeysQuery();
  const { data: messages } = useMessagesQuery(currentContact, currentChannel);

  const { mutateAsync: sendDirectMessage } = useNostrSendDirectMessage(
    privateKey!!,
    receiverPubKey,
    undefined,
  );
  const { mutateAsync: sendPublicMessage } = useNostrSendPublicMessage(
    currentChannel?.id,
    undefined,
  );

  return useMutation(
    ["chats/send-message"],
    async (message: Message) => {
      if (!currentChannel && isCommunity(currentContact?.name)) {
        throw new Error(
          "[Chat][SendMessage] – provided user is community but channel not found",
        );
      }

      if (currentChannel) {
        return sendPublicMessage({ message: message.content });
      } else if (currentContact) {
        return sendDirectMessage({ message: message.content });
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
            activeUsername,
            currentChannel?.id ?? currentContact?.pubkey,
          ],
          [
            ...messages.filter(
              (m) => m.content !== message.content && m.sent !== 2,
            ),
            message,
          ],
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
              activeUsername,
              currentChannel?.id ?? currentContact?.pubkey,
            ],
            [
              ...messages.filter(
                (m) => m.content !== message.content && m.sent !== 2,
              ),
              message,
            ],
          );
        }
      },
    },
  );
}
