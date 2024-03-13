import { DirectContact } from "../../nostr";
import { ChatQueries } from "../../queries";
import { QueryClient } from "@tanstack/react-query";

export function updateContactsBasedOnResult(
  queryClient: QueryClient,
  activeUsername: string | undefined,
  contact: DirectContact,
) {
  queryClient.setQueryData<DirectContact[]>(
    [ChatQueries.ORIGINAL_DIRECT_CONTACTS, activeUsername],
    (directContacts) => [
      ...(directContacts ?? []).filter((dc) => dc.pubkey !== contact.pubkey),
      contact,
    ],
  );
  queryClient.setQueryData<DirectContact[]>(
    [ChatQueries.DIRECT_CONTACTS, activeUsername],
    (directContacts) => [
      ...(directContacts ?? []).filter((dc) => dc.pubkey !== contact.pubkey),
      contact,
    ],
  );
}
