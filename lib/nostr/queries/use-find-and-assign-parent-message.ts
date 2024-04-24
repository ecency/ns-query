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
    async (message: DirectMessage) => {
      if (!message.parentMessageId) {
        return;
      }
      const [parentMessageEncrypted] = await findMessagesByIds([
        {
          kinds: [Kind.EncryptedDirectMessage],
          "#e": [message.parentMessageId],
        },
      ]);

      if (parentMessageEncrypted) {
        const parentMessage = (await convertEvent<Kind.EncryptedDirectMessage>(
          parentMessageEncrypted,
          publicKey!!,
          privateKey!!,
        )) as DirectMessage;

        if (parentMessage) {
          message.parentMessage = parentMessage;
        }
      }
    },
    [findMessagesByIds, privateKey, publicKey],
  );
}
