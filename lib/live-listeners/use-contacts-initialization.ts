import { Profile } from "../nostr";
import { useNonDirectContactsQuery } from "../queries";
import { useEffect } from "react";
import { useAddDirectContact } from "../mutations";

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
  const { data: nonDirectContacts } = useNonDirectContactsQuery();
  const { mutateAsync: addDirectContact } = useAddDirectContact();

  useEffect(() => {
    addContacts(nonDirectContacts ?? []);
  }, [nonDirectContacts]);

  const addContacts = async (profiles: Profile[]) => {
    if (profiles.length > 0) {
      console.debug(
        "[ns-query] Found non-direct contacts Nostr profiles",
        profiles,
      );
    }
    for (const profile of profiles) {
      console.debug("[ns-query] Adding non-direct contact", profile);

      await addDirectContact({
        pubkey: profile.creator,
        name: profile.name,
      });
    }
  };
}
