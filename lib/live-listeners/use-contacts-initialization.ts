import { useAddDirectContact } from "../mutations";
import {
  Profile,
  useKeysQuery,
  useNostrFetchQuery,
  useNostrGetUserProfilesQuery,
} from "../nostr";
import { Kind } from "nostr-tools";
import { ChatQueries, useOriginalDirectContactsQuery } from "../queries";
import { useContext, useEffect, useState } from "react";
import { ChatContext } from "../chat-context-provider";

/**
 * Fetching users where current user is in contact list and add them to contact list
 *
 * Use-case
 * * User send a message to current – current was added to contact list;
 * * Current user logging in and have to see these messages;
 *
 * @note It should be done only app starting. While app is running new contacts will be added by messages live listener
 * @see useLiveDirectMessagesListener
 */
export function useContactsInitialization() {
  const { publicKey } = useKeysQuery();
  const { activeUsername } = useContext(ChatContext);

  // Uses for explicitly checking of fetching status because react-query has isSuccess by default since query has default value
  const [isOriginalDirectContactsFetched, setIsOriginalDirectContactsFetched] =
    useState(false);

  const originalDirectContactsQuery = useOriginalDirectContactsQuery();
  const { data: nonDirectContactsKeys } = useNostrFetchQuery<string[]>(
    [ChatQueries.NON_DIRECT_CONTACTS, activeUsername],
    [
      {
        kinds: [Kind.Contacts],
        "#p": [publicKey!!],
      },
    ],
    (events) => events.map((event) => event.pubkey),
    {
      enabled:
        !!publicKey && (originalDirectContactsQuery.data?.length ?? 0) > 0,
      initialData: [],
    },
  );
  const {
    data: nonDirectContactsProfiles,
    refetch: fetchNonDirectContactsProfiles,
  } = useNostrGetUserProfilesQuery(nonDirectContactsKeys ?? []);
  const { mutateAsync: addDirectContact } = useAddDirectContact();

  useEffect(() => {
    const notInDirectContactList = (nonDirectContactsKeys ?? []).filter(
      (key) =>
        originalDirectContactsQuery.data?.every((dc) => dc.pubkey !== key),
    );
    if (notInDirectContactList.length > 0 && isOriginalDirectContactsFetched) {
      console.debug(
        "[ns-query] Direct contacts are",
        originalDirectContactsQuery.data,
      );
      console.debug(
        "[ns-query] Non-direct contacts found",
        notInDirectContactList,
      );
      fetchNonDirectContactsProfiles();
    }
  }, [
    nonDirectContactsKeys,
    originalDirectContactsQuery.data,
    isOriginalDirectContactsFetched,
  ]);

  useEffect(() => {
    if (nonDirectContactsProfiles && nonDirectContactsProfiles.length > 0) {
      addContacts(nonDirectContactsProfiles);
    }
  }, [nonDirectContactsProfiles]);

  const addContacts = async (profiles: Profile[]) => {
    console.debug(
      "[ns-query] Found non-direct contacts Nostr profiles",
      profiles,
    );
    for (const profile of profiles) {
      console.debug("[ns-query] Adding non-direct contact", profile);

      await addDirectContact({
        pubkey: profile.creator,
        name: profile.name,
        unread: 1,
      });
    }
  };
}
