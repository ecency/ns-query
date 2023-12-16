import { Kind } from "nostr-tools";
import { useNostrFetchQuery } from "../core";
import { convertEvent } from "../utils/event-converter";
import { NostrQueries } from "./queries";
import { DirectContact, Message } from "../types";

export function useDirectMessagesQuery(
  directContacts: DirectContact[],
  publicKey: string,
  privateKey: string,
) {
  return useNostrFetchQuery<Message[]>(
    [NostrQueries.DIRECT_MESSAGES],
    [
      {
        kinds: [Kind.EncryptedDirectMessage],
        authors: [publicKey],
      },
      {
        kinds: [Kind.EncryptedDirectMessage],
        "#p": [publicKey],
      },
    ],
    async (events) =>
      Promise.all(
        events.map(
          (event) =>
            convertEvent<Kind.EncryptedDirectMessage>(
              event,
              publicKey,
              privateKey,
            )!!,
        ),
      ),
    {
      enabled: directContacts.length > 0,
      initialData: [],
      refetchInterval: 10000,
    },
  );
}
