import {DirectMessage, useDirectMessagesQuery, useKeysQuery, useNostrFetchMutation,} from "../nostr";
import {useDirectContactsQuery} from "./direct-contacts-query";
import {useAddDirectContact} from "../mutations";
import {Kind} from "nostr-tools";
import {useEffect} from "react";

export function useListenNewComingMessagesQuery() {
  const contactsQuery = useDirectContactsQuery();
  const { publicKey, privateKey } = useKeysQuery();
  const { data: directMessages } = useDirectMessagesQuery(
    contactsQuery.data ?? [],
    publicKey!!,
    privateKey!!,
  );
  const { mutateAsync: addDirectContact } = useAddDirectContact();
  const { mutateAsync: getAccountMetadata } = useNostrFetchMutation(
    ["chats/update-nostr-profile"],
    [],
  );

  // Check new coming messages if there aren't direct contact yet
  useEffect(() => {
    Array.from(
      new Set(
        (directMessages as DirectMessage[])
          ?.filter((m) =>
            contactsQuery.data
              ? !contactsQuery.data?.some(
                  (dc) => dc.pubkey === m.peer || dc.pubkey === m.creator,
                )
              : false,
          )
          .map((m) => (m.creator !== publicKey ? m.creator : m.peer)),
      ).values(),
    ).forEach(async (pubkey) => {
      const data = await getAccountMetadata([
        {
          kinds: [Kind.Metadata],
          "#p": [pubkey],
        },
      ]);
      if (data.length > 0) {
        await addDirectContact({
          pubkey,
          name: JSON.parse(data[0]?.content)?.name ?? "",
        });
      }
    });
  }, [directMessages, contactsQuery.data]);
}
