import { ChatQueries } from "./queries";
import { DirectContact, useKeysQuery, useNostrFetchQuery } from "../nostr";
import { Kind } from "nostr-tools";
import { useContext } from "react";
import { ChatContext } from "../chat-context-provider";

export function useDirectContactsQuery() {
  const { activeUsername } = useContext(ChatContext);
  const { hasKeys } = useKeysQuery();

  return useNostrFetchQuery<DirectContact[]>(
    [ChatQueries.DIRECT_CONTACTS, activeUsername],
    [Kind.Contacts],
    (events) => {
      // Get first event with profile info
      // note: events could be duplicated
      const profileEvent = events.find((event) => event.kind === Kind.Contacts);
      if (profileEvent) {
        return profileEvent.tags.map(([pubkey, name]) => ({ pubkey, name }));
      }
      return [];
    },
    {
      initialData: [],
      enabled: hasKeys,
      refetchOnMount: false,
    },
  );
}
