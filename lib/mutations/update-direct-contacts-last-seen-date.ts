import { Kind } from "nostr-tools";
import { DirectContact, useNostrPublishMutation } from "../nostr";
import { ChatQueries } from "../queries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { ChatContext } from "../chat-context-provider";
import { updateContactsBasedOnResult } from "./utils";
import { ContactsTagsBuilder } from "../utils";

export function useUpdateDirectContactsLastSeenDate() {
  const queryClient = useQueryClient();
  const { activeUsername } = useContext(ChatContext);

  const { mutateAsync: publishDirectContact } = useNostrPublishMutation(
    ["chats/nostr-publish-direct-contact"],
    Kind.Contacts,
    () => {},
  );

  return useMutation({
    mutationKey: ["chats/nostr-update-direct-contacts-last-seen-date"],
    mutationFn: async ({
      contact,
      lastSeenDate,
    }: {
      contact: DirectContact;
      lastSeenDate: Date;
    }) => {
      const directContacts =
        queryClient.getQueryData<DirectContact[]>([
          ChatQueries.ORIGINAL_DIRECT_CONTACTS,
          activeUsername,
        ]) ?? [];
      console.debug(
        "[ns-query] Updating direct contact last seen date",
        contact,
        lastSeenDate,
      );

      await publishDirectContact({
        tags: [
          ...ContactsTagsBuilder.buildContactsTags(directContacts),
          ...ContactsTagsBuilder.buildLastSeenTags(directContacts, contact),
          ...ContactsTagsBuilder.buildPinTags(directContacts),
          ContactsTagsBuilder.buildLastSeenTag(contact),
        ],
        eventMetadata: "",
      });

      contact.lastSeenDate = lastSeenDate;
      return contact;
    },
    onSuccess: (contact) => {
      if (contact) {
        updateContactsBasedOnResult(queryClient, activeUsername, contact);
      }
    },
  });
}
