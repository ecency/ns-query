import { Kind } from "nostr-tools";
import { useContext } from "react";
import { ChatContext } from "../../chat-context-provider";
import { DirectContact, Message } from "../types";
import { useNostrInfiniteFetchQuery } from "../core/nostr-infinite-fetch-query";
import { NostrQueries } from "./queries";
import { convertEvent } from "../utils/event-converter";
import { useKeysQuery } from "../core";

export function useDirectMessagesQuery(contact?: DirectContact) {
  const { activeUsername } = useContext(ChatContext);
  const { privateKey, publicKey } = useKeysQuery();

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
      enabled: !!contact && !!activeUsername && !!privateKey && !!publicKey,
      initialData: { pages: [[]], pageParams: [] },
      getNextPageParam: (lastPage) => lastPage?.[lastPage?.length - 1]?.created,
    },
  );
}
