import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { ChatContext } from "../chat-context-provider";
import { DirectContact, useNostrPublishMutation } from "../nostr";
import { Kind } from "nostr-tools";
import { ChatQueries } from "../queries";
import { updateContactsBasedOnResult } from "./utils";

export function usePinContact() {
  const queryClient = useQueryClient();
  const { activeUsername } = useContext(ChatContext);

  const { mutateAsync: publishDirectContact } = useNostrPublishMutation(
    ["chats/nostr-publish-direct-contact"],
    Kind.Contacts,
    () => {},
  );

  return useMutation(
    ["chats/nostr-update-direct-contacts-pins"],
    async ({
      contact,
      pinned,
    }: {
      contact: DirectContact;
      pinned: boolean;
    }) => {
      const directContacts =
        queryClient.getQueryData<DirectContact[]>([
          ChatQueries.ORIGINAL_DIRECT_CONTACTS,
          activeUsername,
        ]) ?? [];
      console.debug("[ns-query] Updating direct contact pin", contact, pinned);

      const contactTags = directContacts.map((c) => [
        "p",
        c.pubkey,
        "",
        c.name,
      ]);
      const pinTags = directContacts
        .filter((c) => contact.pubkey !== c.pubkey)
        .map((c) => ["pinned", c.pubkey, c.pinned ? "true" : "false"]);
      const lastSeenTags = directContacts.map((c) => [
        "lastSeenDate",
        c.pubkey,
        c.lastSeenDate?.getTime().toString() ?? "",
      ]);

      await publishDirectContact({
        tags: [
          ...contactTags,
          ...lastSeenTags,
          ...pinTags,
          ["pinned", contact.pubkey, pinned ? "true" : "false"],
        ],
        eventMetadata: "",
      });

      contact.pinned = pinned;
      return contact;
    },
    {
      onSuccess: (contact) => {
        if (contact) {
          updateContactsBasedOnResult(queryClient, activeUsername, contact);
        }
      },
    },
  );
}
