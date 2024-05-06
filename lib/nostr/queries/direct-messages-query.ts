import { Kind } from "nostr-tools";
import { useContext } from "react";
import { ChatContext } from "../../chat-context-provider";
import { DirectContact, DirectMessage, Message } from "../types";
import { useNostrInfiniteFetchQuery } from "../core/nostr-infinite-fetch-query";
import { NostrQueries } from "./queries";
import { convertEvent } from "../utils/event-converter";
import { useKeysQuery } from "../core";
import { useFindAndAssignParentDirectMessage } from "./use-find-and-assign-parent-direct-message";

export function useDirectMessagesQuery(contact?: DirectContact) {
  const { activeUsername } = useContext(ChatContext);
  const { privateKey, publicKey } = useKeysQuery();

  const findAndAssignParentMessage = useFindAndAssignParentDirectMessage();

  return useNostrInfiniteFetchQuery<Message[]>(
    [NostrQueries.DIRECT_MESSAGES, activeUsername, contact?.pubkey],
    [
      {
        kinds: [Kind.EncryptedDirectMessage],
        "#p": [contact?.pubkey ?? ""],
        authors: [publicKey!!],
        limit: 25,
      },
      {
        kinds: [Kind.EncryptedDirectMessage],
        "#p": [publicKey!!],
        authors: [contact?.pubkey ?? ""],
        limit: 25,
      },
    ],
    async (events) => {
      const results: DirectMessage[] = [];

      for (const event of events) {
        const message = (await convertEvent<Kind.EncryptedDirectMessage>(
          event,
          publicKey!!,
          privateKey!!,
        )) as DirectMessage;
        results.push(message);
      }

      await findAndAssignParentMessage(results);
      return results;
    },
    {
      enabled:
        !!contact?.pubkey && !!activeUsername && !!privateKey && !!publicKey,
      initialData: { pages: [[]], pageParams: [] },
      getNextPageParam: (lastPage) =>
        lastPage?.sort((a, b) => a.created - b.created)?.[0]?.created,
      refetchOnMount: false,
    },
  );
}
