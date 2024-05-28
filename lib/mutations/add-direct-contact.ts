import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatQueries } from "../queries";
import { DirectContact, useNostrPublishMutation } from "../nostr";
import { useContext } from "react";
import { Kind } from "nostr-tools";
import { ChatContext } from "../chat-context-provider";
import { ContactsTagsBuilder } from "../utils";

export function useAddDirectContact() {
  const { activeUsername } = useContext(ChatContext);
  const queryClient = useQueryClient();

  const { mutateAsync: publishDirectContact } = useNostrPublishMutation(
    ["chats/nostr-publish-direct-contact"],
    Kind.Contacts,
    () => {},
  );

  return useMutation({
    mutationKey: ["chats/add-direct-contact"],
    mutationFn: async (contact: DirectContact) => {
      console.debug("[ns-query] Attempting adding direct contact", contact);
      const directContacts =
        queryClient.getQueryData<DirectContact[]>([
          ChatQueries.ORIGINAL_DIRECT_CONTACTS,
          activeUsername,
        ]) ?? [];
      const hasInDirectContactsAlready = directContacts.some(
        (c) => c.name === contact.name && c.pubkey === contact.pubkey,
      );

      if (hasInDirectContactsAlready) {
        console.debug("[ns-query] Direct contact exists already", contact);
        return;
      }

      await publishDirectContact({
        tags: [
          ...ContactsTagsBuilder.buildContactsTags(directContacts),
          ...ContactsTagsBuilder.buildLastSeenTags(directContacts, contact),
          ...ContactsTagsBuilder.buildPinTags(directContacts),
          ContactsTagsBuilder.buildContactTag(contact),
          ContactsTagsBuilder.buildLastSeenTag(contact),
        ],
        eventMetadata: "",
      });
      console.debug("[ns-query] Added direct contact to list", contact);
      return contact;
    },
    onSuccess: (contact) => {
      if (contact) {
        queryClient.setQueryData<DirectContact[]>(
          [ChatQueries.DIRECT_CONTACTS, activeUsername],
          (directContacts) => {
            const notExists = directContacts?.every(
              (dc) => dc.pubkey !== contact.pubkey,
            );
            if (notExists) {
              return [...(directContacts ?? []), contact];
            }
            return directContacts;
          },
        );

        queryClient.setQueryData<DirectContact[]>(
          [ChatQueries.ORIGINAL_DIRECT_CONTACTS, activeUsername],
          (data) => [...(data ?? []), contact],
        );
      }
    },
  });
}
