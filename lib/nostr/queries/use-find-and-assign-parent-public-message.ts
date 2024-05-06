import { useCallback, useContext } from "react";
import { Kind } from "nostr-tools";
import { convertEvent } from "../utils/event-converter";
import { Message, PublicMessage } from "../types";
import { useKeysQuery, useNostrFetchMutation } from "../core";
import { NostrQueries } from "./queries";
import { ChatContext } from "../../chat-context-provider";

export function useFindAndAssignParentPublicMessage() {
  const { activeUsername } = useContext(ChatContext);
  const { privateKey, publicKey } = useKeysQuery();

  const { mutateAsync: findMessagesByIds } = useNostrFetchMutation(
    [NostrQueries.PUBLIC_MESSAGES, "by-ids", activeUsername],
    [],
  );

  return useCallback(
    async (messages: Message[]) => {
      const messagesWithParent = messages.filter((m) => m.parentMessageId);
      const requiredForFetchParent = messagesWithParent.filter((message) =>
        messages.every((m) => m.parentMessageId !== message.id),
      );

      const parentMessagesEncrypted = await findMessagesByIds([
        {
          kinds: [Kind.ChannelMessage],
          ids: requiredForFetchParent.map((m) => m.parentMessageId!!),
        },
      ]);
      const parentMessages = parentMessagesEncrypted.map(
        (e) => convertEvent(e) as PublicMessage,
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
