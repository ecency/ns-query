import {
  useKeysQuery,
  useNostrFetchQuery,
  useNostrGetUserProfilesQuery,
} from "../nostr";
import { ChatQueries } from "./queries";
import { Kind } from "nostr-tools";
import { useContext, useMemo } from "react";
import { ChatContext } from "../chat-context-provider";
import { useOriginalDirectContactsQuery } from "./direct-contacts-query";

/**
 * Fetching of users list where current active user is in contacts list
 *
 * @usage User sent a message to current active user but this sender hasn't appeared in contacts list yet
 */
export function useNonDirectContactsQuery() {
  const { publicKey } = useKeysQuery();
  const { activeUsername } = useContext(ChatContext);

  const originalDirectContactsQuery = useOriginalDirectContactsQuery();

  const { data: contactsWhereCurrentUserIn } = useNostrFetchQuery<string[]>(
    [ChatQueries.NON_DIRECT_CONTACTS, activeUsername],
    [
      {
        kinds: [Kind.Contacts],
        "#p": [publicKey!!],
      },
    ],
    (events) => events.map((event) => event.pubkey),
    {
      enabled: !!publicKey && originalDirectContactsQuery.isFetched,
      initialData: [],
    },
  );

  const nonDirectContactsKeys = useMemo(
    () =>
      contactsWhereCurrentUserIn?.filter(
        (key) =>
          originalDirectContactsQuery.data?.every((dc) => dc.pubkey !== key),
      ) ?? [],
    [contactsWhereCurrentUserIn, originalDirectContactsQuery.data],
  );

  return useNostrGetUserProfilesQuery(nonDirectContactsKeys ?? []);
}
