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
import { PublishNostrError } from "../nostr/errors";
import { convertEvent } from "../nostr/utils/event-converter";
import { isCommunity } from "../utils";
import { Kind } from "nostr-tools";
import { updateMessageStatusInQuery } from "./utils";

export function useResendMessage(
  currentChannel?: Channel,
  currentContact?: DirectContact,
  onSuccess?: () => void,
) {
  const queryClient = useQueryClient();

  const { receiverPubKey, activeUsername } = useContext(ChatContext);
  const { privateKey, publicKey } = useKeysQuery();

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
        updateMessageStatusInQuery(
          queryClient,
          message,
          0,
          activeUsername,
          currentChannel?.id ?? currentContact?.pubkey,
        );
        onSuccess?.();
      },
      onError: async (error: PublishNostrError | Error) => {
        if ("event" in error) {
          const message = await convertEvent<
            Kind.EncryptedDirectMessage | Kind.ChannelMessage
          >(error.event, publicKey!!, privateKey!!)!!;

          updateMessageStatusInQuery(
            queryClient,
            message,
            2,
            activeUsername,
            currentChannel?.id ?? currentContact?.pubkey,
          );
        }
      },
    },
  );
}
