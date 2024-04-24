import { Kind } from "nostr-tools";
import { useContext } from "react";
import { ChatContext } from "../../chat-context-provider";
import { Message } from "../types";
import { NostrQueries } from "./queries";
import { convertEvent } from "../utils/event-converter";
import { useKeysQuery, useNostrFetchQuery } from "../core";

/**
 * Fetch specific messages by their ID
 * @param ids Messages IDs
 */
export function useDirectMessagesByIdsQuery(ids: string[]) {
  const { activeUsername } = useContext(ChatContext);
  const { privateKey, publicKey } = useKeysQuery();

  return useNostrFetchQuery<Message[]>(
    [NostrQueries.DIRECT_MESSAGES, "by-ids", activeUsername, ids],
    [
      {
        kinds: [Kind.EncryptedDirectMessage],
        "#e": ids,
      },
    ],
    async (events) =>
      Promise.all(
        events.map(
          (event) =>
            convertEvent<Kind.EncryptedDirectMessage>(
              event,
              publicKey!!,
              privateKey!!,
            )!!,
        ),
      ),
    {
      enabled:
        !!activeUsername && !!privateKey && !!publicKey && ids.length > 0,
      initialData: [],
      refetchOnMount: false,
    },
  );
}
