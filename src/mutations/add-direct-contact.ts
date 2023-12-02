import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatQueries, useDirectContactsQuery } from "../queries";
import { DirectContact, NostrContext, useNostrPublishMutation } from "../nostr";
import { useContext } from "react";
import { Kind } from "nostr-tools";

export function useAddDirectContact() {
  const { activeUsername } = useContext(NostrContext);
  const queryClient = useQueryClient();

  const { data: directContacts } = useDirectContactsQuery();
  const { mutateAsync: publishDirectContact } = useNostrPublishMutation(
    ["chats/nostr-publish-direct-contact"],
    Kind.Contacts,
    () => {},
  );

  return useMutation(
    ["chats/add-direct-contact"],
    async (contact: DirectContact) => {
      const hasInDirectContactsAlready = directContacts?.some(
        (c) => c.name === contact.name && c.pubkey === contact.pubkey,
      );
      if (!hasInDirectContactsAlready) {
        await publishDirectContact({
          tags: [
            ...(directContacts ?? []).map((contact) => [
              contact.pubkey,
              contact.name,
            ]),
            [contact.pubkey, contact.name],
          ],
          eventMetadata: "",
        });

        return contact;
      }
      return;
    },
    {
      onSuccess: (contact) => {
        if (contact) {
          queryClient.setQueryData(
            [ChatQueries.DIRECT_CONTACTS, activeUsername],
            [...(directContacts ?? []), contact],
          );
        }
      },
    },
  );
}
