import {
  DirectMessage,
  Message,
  NostrQueries,
  useKeysQuery,
  useLiveListener,
  useNostrFetchMutation,
} from "../nostr";
import { Kind } from "nostr-tools";
import { convertEvent } from "../nostr/utils/event-converter";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { useAddDirectContact } from "../mutations";
import { ChatQueries, useDirectContactsQuery } from "../queries";
import { useContext } from "react";
import { ChatContext } from "../chat-context-provider";

export function useLiveDirectMessagesListener() {
  const queryClient = useQueryClient();

  const { activeUsername } = useContext(ChatContext);

  const { data: directContacts } = useDirectContactsQuery();
  const { publicKey, privateKey } = useKeysQuery();

  const { mutateAsync: addDirectContact } = useAddDirectContact();
  const { mutateAsync: getAccountMetadata } = useNostrFetchMutation(
    ["chats/update-nostr-profile"],
    [],
  );

  const addContact = async (pubkey: string) => {
    const data = await getAccountMetadata([
      {
        kinds: [Kind.Metadata],
        "#p": [pubkey],
      },
    ]);
    if (data.length > 0) {
      const nextContact = {
        pubkey,
        name: JSON.parse(data[0]?.content)?.name ?? "",
      };
      await addDirectContact(nextContact);
      return nextContact;
    }
    return;
  };

  useLiveListener<Message | null>(
    [
      {
        kinds: [Kind.EncryptedDirectMessage],
        authors: [publicKey!!],
      },
      {
        kinds: [Kind.EncryptedDirectMessage],
        "#p": [publicKey!!],
      },
    ],
    (event) =>
      convertEvent<Kind.EncryptedDirectMessage>(
        event,
        publicKey!!,
        privateKey!!,
      ),
    async (message) => {
      if (!message) {
        return;
      }
      let contact = directContacts?.find(
        (dc) =>
          dc.pubkey === message.creator ||
          dc.pubkey === (message as DirectMessage).peer,
      );

      if (!contact) {
        const pubKey =
          message.creator !== publicKey
            ? message.creator
            : (message as DirectMessage).peer;
        contact = await addContact(pubKey);
      }

      if (!contact) {
        return;
      }

      const directMessage = message as DirectMessage;
      const previousData = queryClient.getQueryData<
        InfiniteData<DirectMessage[]>
      >([NostrQueries.DIRECT_MESSAGES, activeUsername, contact.pubkey]);

      if (previousData) {
        const dump: InfiniteData<DirectMessage[]> = {
          ...previousData,
          pages: [...previousData.pages],
        };
        dump.pages[0] = [...dump.pages[0], directMessage];
        queryClient.setQueryData(
          [NostrQueries.DIRECT_MESSAGES, activeUsername, contact.pubkey],
          dump,
        );
        await queryClient.invalidateQueries([
          NostrQueries.DIRECT_MESSAGES,
          activeUsername,
          contact.pubkey,
        ]);
      }

      queryClient.setQueryData(
        [ChatQueries.LAST_MESSAGE, activeUsername, contact.pubkey],
        message,
      );
    },
    { enabled: !!publicKey && !!privateKey },
  );
}
