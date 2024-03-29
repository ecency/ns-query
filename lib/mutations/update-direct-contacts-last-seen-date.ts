import { Kind } from "nostr-tools";
import { DirectContact, useNostrPublishMutation } from "../nostr";
import { ChatQueries } from "../queries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { ChatContext } from "../chat-context-provider";
import { updateContactsBasedOnResult } from "./utils";

export function useUpdateDirectContactsLastSeenDate() {
  const queryClient = useQueryClient();
  const { activeUsername } = useContext(ChatContext);

  const { mutateAsync: publishDirectContact } = useNostrPublishMutation(
    ["chats/nostr-publish-direct-contact"],
    Kind.Contacts,
    () => {},
  );

  return useMutation(
    ["chats/nostr-update-direct-contacts-last-seen-date"],
    async ({
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

      const contactTags = directContacts.map((c) => [
        "p",
        c.pubkey,
        "",
        c.name,
      ]);
      const pinTags = directContacts.map((c) => [
        "pinned",
        c.pubkey,
        c.pinned ? "true" : "false",
      ]);
      const lastSeenTags = directContacts
        .filter((c) => contact.pubkey !== c.pubkey)
        .map((c) => [
          "lastSeenDate",
          c.pubkey,
          c.lastSeenDate?.getTime().toString() ?? "",
        ]);

      await publishDirectContact({
        tags: [
          ...contactTags,
          ...lastSeenTags,
          ...pinTags,
          ["lastSeenDate", contact.pubkey, lastSeenDate.getTime().toString()],
        ],
        eventMetadata: "",
      });

      contact.lastSeenDate = lastSeenDate;
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
