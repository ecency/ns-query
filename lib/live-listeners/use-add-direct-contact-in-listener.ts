import { useCallback } from "react";
import { Kind } from "nostr-tools";
import { DirectContact, useNostrFetchMutation } from "../nostr";
import { useAddDirectContact } from "../mutations";

export function useAddDirectContactInListener() {
  const { mutateAsync: addDirectContact } = useAddDirectContact();
  const { mutateAsync: getAccountMetadata } = useNostrFetchMutation(
    ["chats/nostr-get-user-profile"],
    [],
  );

  return useCallback(
    async (pubkey: string) => {
      const data = await getAccountMetadata([
        {
          kinds: [Kind.Metadata],
          authors: [pubkey],
        },
      ]);

      if (data.length === 0) {
        return;
      }

      const nextContact: DirectContact = {
        pubkey,
        name: JSON.parse(data[0]?.content)?.name ?? "",
      };
      await addDirectContact(nextContact);
      return nextContact;
    },
    [addDirectContact, getAccountMetadata],
  );
}
