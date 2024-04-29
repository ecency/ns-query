import {
  DirectContact,
  DirectMessage,
  Message,
  NostrQueries,
  useKeysQuery,
  useLiveListener,
} from "../nostr";
import { Kind } from "nostr-tools";
import { convertEvent } from "../nostr/utils/event-converter";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { ChatQueries } from "../queries";
import { useContext, useMemo } from "react";
import { ChatContext } from "../chat-context-provider";
import { useAddDirectContactInListener } from "./use-add-direct-contact-in-listener";
import { InfiniteQueryDataUtil } from "../utils";

export function useLiveDirectMessagesListener() {
  const queryClient = useQueryClient();
  const { activeUsername } = useContext(ChatContext);

  const addContact = useAddDirectContactInListener();

  const { publicKey, privateKey } = useKeysQuery();

  const filters = useMemo(
    () =>
      publicKey
        ? [
            {
              kinds: [Kind.EncryptedDirectMessage],
              authors: [publicKey!!],
            },
            {
              kinds: [Kind.EncryptedDirectMessage],
              "#p": [publicKey!!],
            },
          ]
        : [],
    [publicKey],
  );

  useLiveListener<Message>(
    filters,
    (event) =>
      convertEvent<Kind.EncryptedDirectMessage>(
        event,
        publicKey!!,
        privateKey!!,
      )!!,
    async (message) => {
      if (!message) {
        return;
      }
      console.debug("[ns-query] New message received", message);
      const directContacts =
        queryClient.getQueryData<DirectContact[]>([
          ChatQueries.DIRECT_CONTACTS,
          activeUsername,
        ]) ?? [];
      let contact = directContacts.find(
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

      console.debug("[ns-query] New message assigned", message, contact);
      const directMessage = message as DirectMessage;

      queryClient.setQueryData<InfiniteData<DirectMessage[]>>(
        [NostrQueries.DIRECT_MESSAGES, activeUsername, contact.pubkey],
        (data) =>
          InfiniteQueryDataUtil.safeDataUpdate(data, (d) =>
            InfiniteQueryDataUtil.pushElementToFirstPage(
              d,
              directMessage,
              (m) => m.id === message.id,
            ),
          ),
      );
      await queryClient.invalidateQueries([
        NostrQueries.DIRECT_MESSAGES,
        activeUsername,
        contact.pubkey,
      ]);
    },
    { enabled: !!publicKey && !!privateKey },
  );
}
