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
import { PublishNostrError } from "../nostr/errors";
import { convertEvent } from "../nostr/utils/event-converter";
import { Kind } from "nostr-tools";
import { updateMessageStatusInQuery } from "./utils";

interface Payload {
  message: string;
  forwardedFrom?: string;
  // Indicates reply parent message ID
  parentMessageId?: string;
}

export function useSendMessage(
  currentChannel?: Channel,
  currentContact?: DirectContact,
  onSuccess?: () => void,
) {
  const queryClient = useQueryClient();

  const { activeUsername } = useContext(ChatContext);
  const { privateKey, publicKey } = useKeysQuery();

  const { mutateAsync: sendDirectMessage } = useNostrSendDirectMessage(
    privateKey!!,
    currentContact?.pubkey,
    undefined,
  );
  const { mutateAsync: sendPublicMessage } = useNostrSendPublicMessage(
    currentChannel?.id,
    undefined,
  );
  const { mutateAsync: addDirectContact } = useAddDirectContact();

  return useMutation(
    ["chats/send-message"],
    async ({ forwardedFrom, message, parentMessageId }: Payload) => {
      if (!message || message.includes("Uploading")) {
        throw new Error(
          "[Chat][SendMessage] – empty message or has uploading file",
        );
      }

      // Add user to direct contacts if it's not there yet
      // E.g. if user opened chat room directly from search bar
      if (currentContact) {
        addDirectContact(currentContact);
      }

      if (currentChannel) {
        return sendPublicMessage({ message, forwardedFrom });
      } else if (currentContact) {
        return sendDirectMessage({ message, forwardedFrom, parentMessageId });
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
