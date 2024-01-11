import { useAddDirectContact } from "../mutations";
import {
  Profile,
  useKeysQuery,
  useNostrFetchQuery,
  useNostrGetUserProfilesQuery,
} from "../nostr";
import { Kind } from "nostr-tools";
import { ChatQueries } from "../queries";
import { useContext, useEffect } from "react";
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

  const { data: nonDirectContactsKeys } = useNostrFetchQuery<string[]>(
    [ChatQueries.NON_DIRECT_CONTACTS, activeUsername],
    [
      {
        kinds: [Kind.Contacts],
        "#p": [publicKey!!],
      },
    ],
    (events) => events.map((event) => event.pubkey),
    { enabled: !!publicKey, initialData: [] },
  );
  const {
    data: nonDirectContactsProfiles,
    refetch: fetchNonDirectContactsProfiles,
  } = useNostrGetUserProfilesQuery(nonDirectContactsKeys ?? []);
  const { mutateAsync: addDirectContact } = useAddDirectContact();

  useEffect(() => {
    if ((nonDirectContactsKeys ?? []).length > 0) {
      fetchNonDirectContactsProfiles();
    }
  }, [nonDirectContactsKeys]);

  useEffect(() => {
    addContacts(nonDirectContactsProfiles ?? []);
  }, [nonDirectContactsProfiles]);

  const addContacts = async (profiles: Profile[]) => {
    for (const profile of profiles) {
      await addDirectContact({
        pubkey: profile.creator,
        name: profile.name,
      });
    }
  };
}
