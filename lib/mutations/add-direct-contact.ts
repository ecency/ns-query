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
      const directContacts =
        queryClient.getQueryData<DirectContact[]>([
          ChatQueries.ORIGINAL_DIRECT_CONTACTS,
          activeUsername,
        ]) ?? [];
      const hasInDirectContactsAlready = directContacts.some(
        (c) => c.name === contact.name && c.pubkey === contact.pubkey,
      );
      if (!hasInDirectContactsAlready) {
        await publishDirectContact({
          tags: [
            ...(directContacts ?? []).map((contact) => [
              "p",
              contact.pubkey,
              "",
              contact.name,
            ]),
            ["p", contact.pubkey, "", contact.name],
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
