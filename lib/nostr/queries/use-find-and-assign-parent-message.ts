import { useCallback, useContext } from "react";
import { Kind } from "nostr-tools";
import { convertEvent } from "../utils/event-converter";
import { DirectMessage } from "../types";
import { useKeysQuery, useNostrFetchMutation } from "../core";
import { NostrQueries } from "./queries";
import { ChatContext } from "../../chat-context-provider";

export function useFindAndAssignParentMessage() {
  const { activeUsername } = useContext(ChatContext);
  const { privateKey, publicKey } = useKeysQuery();

  const { mutateAsync: findMessagesByIds } = useNostrFetchMutation(
    [NostrQueries.DIRECT_MESSAGES, "by-ids", activeUsername],
    [],
  );

  return useCallback(
    async (messages: DirectMessage[]) => {
      const messagesWithParent = messages.filter((m) => m.parentMessageId);
      const requiredForFetchParent = messagesWithParent.filter((message) =>
        messages.every((m) => m.parentMessageId !== message.id),
      );

      const parentMessagesEncrypted = await findMessagesByIds([
        {
          kinds: [Kind.EncryptedDirectMessage],
          ids: requiredForFetchParent.map((m) => m.parentMessageId!!),
        },
      ]);
      const parentMessages = await Promise.all(
        parentMessagesEncrypted.map(
          (e) =>
            convertEvent<Kind.EncryptedDirectMessage>(
              e,
              publicKey!!,
              privateKey!!,
            ) as Promise<DirectMessage>,
        ),
      );

      for (const message of messagesWithParent) {
        message.parentMessage = [...parentMessages, ...messages].find(
          (m) => m.id === message.parentMessageId,
        );
      }
    },
    [findMessagesByIds, privateKey, publicKey],
  );
}
