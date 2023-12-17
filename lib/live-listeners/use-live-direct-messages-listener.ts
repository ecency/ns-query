import {
  DirectContact,
  DirectMessage,
  Message,
  NostrQueries,
  useKeysQuery,
  useLiveListener,
  useNostrFetchMutation,
} from "../nostr";
import { Kind } from "nostr-tools";
import { convertEvent } from "../nostr/utils/event-converter";
import { useQueryClient } from "@tanstack/react-query";
import { useAddDirectContact } from "../mutations";
import { ChatQueries } from "../queries";
import { useContext } from "react";
import { ChatContext } from "../chat-context-provider";

export function useLiveDirectMessagesListener() {
  const queryClient = useQueryClient();

  const { activeUsername } = useContext(ChatContext);
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
      await addDirectContact({
        pubkey,
        name: JSON.parse(data[0]?.content)?.name ?? "",
      });
    }
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

      const directMessage = message as DirectMessage;
      const previousData = queryClient.getQueryData<DirectMessage[]>([
        NostrQueries.DIRECT_MESSAGES,
      ]);

      if (previousData?.some((m) => m.id === directMessage.id)) {
        return;
      }

      queryClient.setQueryData(
        [NostrQueries.DIRECT_MESSAGES],
        [...(previousData ?? []), directMessage],
      );
      await queryClient.invalidateQueries([NostrQueries.DIRECT_MESSAGES]);

      const contacts =
        queryClient.getQueryData<DirectContact[]>([
          ChatQueries.DIRECT_CONTACTS,
          activeUsername,
        ]) ?? [];
      if (
        !contacts.every(
          (c) =>
            c.pubkey === message.creator ||
            c.pubkey === (message as DirectMessage).peer,
        ) ||
        contacts.length === 0
      ) {
        const pubKey =
          message.creator !== publicKey
            ? message.creator
            : (message as DirectMessage).peer;
        await addContact(pubKey);
      }
    },
    { enabled: !!publicKey && !!privateKey },
  );
}
