import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatQueries } from "../queries";
import { DirectContact, useNostrPublishMutation } from "../nostr";
import { useContext } from "react";
import { Kind } from "nostr-tools";
import { ChatContext } from "../chat-context-provider";

export function useAddDirectContact() {
  const { activeUsername } = useContext(ChatContext);
  const queryClient = useQueryClient();

  const { mutateAsync: publishDirectContact } = useNostrPublishMutation(
    ["chats/nostr-publish-direct-contact"],
    Kind.Contacts,
    () => {},
  );

  return useMutation(
    ["chats/add-direct-contact"],
    async (contact: DirectContact) => {
      console.debug("[ns-query] Attempting adding direct contact", contact);
      const directContacts =
        queryClient.getQueryData<DirectContact[]>([
          ChatQueries.ORIGINAL_DIRECT_CONTACTS,
          activeUsername,
        ]) ?? [];
      const hasInDirectContactsAlready = directContacts.some(
        (c) => c.name === contact.name && c.pubkey === contact.pubkey,
      );

      if (!hasInDirectContactsAlready) {
        const contactTags = (directContacts ?? []).map((c) => [
          "p",
          c.pubkey,
          "",
          c.name,
        ]);
        const unreadTags = (directContacts ?? [])
          .filter((c) => contact.pubkey !== c.pubkey)
          .map((c) => ["unread", c.pubkey, c.unread?.toString() ?? "0"]);

        await publishDirectContact({
          tags: [
            ...contactTags,
            ...unreadTags,
            ["p", contact.pubkey, "", contact.name],
            ["unread", contact.pubkey, contact.unread?.toString() ?? "0"],
          ],
          eventMetadata: "",
        });
        console.debug("[ns-query] Added direct contact to list", contact);
        return contact;
      } else {
        console.debug("[ns-query] Direct contact exists already", contact);
      }
      return;
    },
    {
      onSuccess: (contact) => {
        if (contact) {
          const directContacts =
            queryClient.getQueryData<DirectContact[]>([
              ChatQueries.DIRECT_CONTACTS,
              activeUsername,
            ]) ?? [];
          if (directContacts.every((dc) => dc.pubkey !== contact.pubkey)) {
            queryClient.setQueryData(
              [ChatQueries.DIRECT_CONTACTS, activeUsername],
              [...directContacts, contact],
            );
          }
          queryClient.setQueryData(
            [ChatQueries.ORIGINAL_DIRECT_CONTACTS, activeUsername],
            [
              ...(queryClient.getQueryData<DirectContact[]>([
                ChatQueries.ORIGINAL_DIRECT_CONTACTS,
                activeUsername,
              ]) ?? []),
              contact,
            ],
          );
        }
      },
    },
  );
}
