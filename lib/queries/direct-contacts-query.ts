import { ChatQueries } from "./queries";
import { DirectContact, useKeysQuery, useNostrFetchQuery } from "../nostr";
import { Event, Kind } from "nostr-tools";
import { useContext } from "react";
import { ChatContext } from "../chat-context-provider";
import { isAfter } from "date-fns";

function convertEventToDirectContacts(
  events: Event[],
  activeUserContact?: DirectContact,
) {
  // Get first event with profile info
  // note: events could be duplicated
  const profileEvent = events.find((event) => event.kind === Kind.Contacts);
  if (profileEvent) {
    const contacts: DirectContact[] = profileEvent.tags
      .filter(([tag]) => tag === "p")
      .map(([_, pubkey, __, name]) => ({
        pubkey,
        name,
      }));

    profileEvent.tags
      .filter(([tag]) => tag === "lastSeenDate")
      .forEach(([_, pubkey, value]) => {
        const contactIndex = contacts.findIndex((c) => c.pubkey === pubkey);
        if (contactIndex > -1) {
          contacts[contactIndex].lastSeenDate = new Date(+value);
        }
      });

    if (
      activeUserContact &&
      contacts.every((c) => c.pubkey !== activeUserContact.pubkey)
    ) {
      contacts.push(activeUserContact);
    }
    return contacts;
  }
  return activeUserContact ? [activeUserContact] : [];
}

/**
 * Original direct contacts uses for storing only Nostr contacts w/o any modification
 * As direct contacts query could be updated to many reasons so this query should be read-only
 */
export function useOriginalDirectContactsQuery() {
  const { activeUsername } = useContext(ChatContext);
  const { hasKeys, publicKey } = useKeysQuery();

  return useNostrFetchQuery<DirectContact[]>(
    [ChatQueries.ORIGINAL_DIRECT_CONTACTS, activeUsername],
    [Kind.Contacts],
    (events) =>
      convertEventToDirectContacts(events, {
        name: activeUsername!,
        pubkey: publicKey!,
      }),
    {
      initialData: [],
      enabled: hasKeys,
      refetchOnMount: false,
    },
  );
}

export function useDirectContactsQuery() {
  const { activeUsername } = useContext(ChatContext);
  const { hasKeys, publicKey } = useKeysQuery();

  return useNostrFetchQuery<DirectContact[]>(
    [ChatQueries.DIRECT_CONTACTS, activeUsername],
    [Kind.Contacts],
    (events) =>
      convertEventToDirectContacts(events, {
        name: activeUsername!,
        pubkey: publicKey!,
      }),
    {
      initialData: [],
      enabled: hasKeys,
      refetchOnMount: false,
      select: (data) =>
        data.sort((a, b) => {
          if (
            a.lastSeenDate instanceof Date &&
            b.lastSeenDate instanceof Date &&
            isAfter(a.lastSeenDate, b.lastSeenDate)
          ) {
            return -1;
          }
          return 0;
        }),
    },
  );
}
