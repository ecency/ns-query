import { ChatQueries } from "./queries";
import { DirectContact, useKeysQuery, useNostrFetchQuery } from "../nostr";
import { Event, Kind } from "nostr-tools";
import { useContext } from "react";
import { ChatContext } from "../chat-context-provider";

function convertEventToDirectContacts(events: Event[]) {
  // Get first event with profile info
  // note: events could be duplicated
  const profileEvent = events.find((event) => event.kind === Kind.Contacts);
  if (profileEvent) {
    return profileEvent.tags.map(([p, pubkey, relay, name]) => {
      if (p === "p") {
        return {
          pubkey,
          name,
        };
      } else {
        // This workaround should be removed after release because it fixes old behavior
        return {
          pubkey: p,
          name: pubkey,
        };
      }
    });
  }
  return [];
}

/**
 * Original direct contacts uses for storing only Nostr contacts w/o any modification
 * As direct contacts query could be updated to many reasons so this query should be read-only
 */
export function useOriginalDirectContactsQuery() {
  const { activeUsername } = useContext(ChatContext);
  const { hasKeys } = useKeysQuery();

  return useNostrFetchQuery<DirectContact[]>(
    [ChatQueries.ORIGINAL_DIRECT_CONTACTS, activeUsername],
    [Kind.Contacts],
    (events) => convertEventToDirectContacts(events),
    {
      initialData: [],
      enabled: hasKeys,
      refetchOnMount: false,
    },
  );
}

export function useDirectContactsQuery() {
  const { activeUsername } = useContext(ChatContext);
  const { hasKeys } = useKeysQuery();

  return useNostrFetchQuery<DirectContact[]>(
    [ChatQueries.DIRECT_CONTACTS, activeUsername],
    [Kind.Contacts],
    (events) => convertEventToDirectContacts(events),
    {
      initialData: [],
      enabled: hasKeys,
      refetchOnMount: false,
    },
  );
}
