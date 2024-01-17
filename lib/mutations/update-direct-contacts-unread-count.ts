import { Kind } from "nostr-tools";
import { DirectContact, useNostrPublishMutation } from "../nostr";
import { ChatQueries } from "../queries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { ChatContext } from "../chat-context-provider";

export function useUpdateDirectContactsUnreadCount() {
  const queryClient = useQueryClient();
  const { activeUsername } = useContext(ChatContext);

  const { mutateAsync: publishDirectContact } = useNostrPublishMutation(
    ["chats/nostr-publish-direct-contact"],
    Kind.Contacts,
    () => {},
  );

  return useMutation(
    ["chats/nostr-update-direct-contacts-unread-count"],
    async ({ contact, unread }: { contact: DirectContact; unread: number }) => {
      const directContacts =
        queryClient.getQueryData<DirectContact[]>([
          ChatQueries.ORIGINAL_DIRECT_CONTACTS,
          activeUsername,
        ]) ?? [];
      console.debug(
        "[ns-query] Updating direct contact unread count",
        contact,
        directContacts,
      );

      const contactTags = directContacts.map((c) => [
        "p",
        c.pubkey,
        "",
        c.name,
      ]);
      const unreadTags = directContacts
        .filter((c) => contact.pubkey !== c.pubkey)
        .map((c) => ["unread", c.pubkey, c.unread?.toString() ?? "0"]);

      await publishDirectContact({
        tags: [
          ...contactTags,
          ...unreadTags,
          ["unread", contact.pubkey, unread.toString()],
        ],
        eventMetadata: "",
      });

      contact.unread = unread;
      return contact;
    },
    {
      onSuccess: (contact) => {
        if (contact) {
          const directContacts =
            queryClient.getQueryData<DirectContact[]>([
              ChatQueries.DIRECT_CONTACTS,
              activeUsername,
            ]) ?? [];
          const nextDirectContacts = [
            ...directContacts.filter((dc) => dc.pubkey !== contact.pubkey),
            contact,
          ];
          queryClient.setQueryData(
            [ChatQueries.DIRECT_CONTACTS, activeUsername],
            nextDirectContacts,
          );
          console.debug(
            "[ns-query] Next direct contacts",
            contact,
            nextDirectContacts,
          );
        }
      },
    },
  );
}
