import { useKeysQuery, useNostrPublishMutation } from "../core";
import { Kind, nip04 } from "nostr-tools";
import { useMutation } from "@tanstack/react-query";
import { useFindHealthyRelayQuery } from "./find-healthy-relay";
import { convertEvent } from "../utils/event-converter";
import { MessagesManagement } from "../utils";

interface Payload {
  message: string;
  forwardedFrom?: string;
  parentMessageId?: string;
}

export function useNostrSendDirectMessage(
  ownerPrivateKey: string,
  destinationPublicKey?: string,
  parent?: string,
) {
  const { privateKey, publicKey } = useKeysQuery();

  const { mutateAsync: publishEncryptedMessage } = useNostrPublishMutation(
    ["chats/nostr-publish-encrypted-message"],
    Kind.EncryptedDirectMessage,
    () => {},
  );
  const { mutateAsync: findHealthyRelay } = useFindHealthyRelayQuery();

  return useMutation(
    ["chats/send-direct-message"],
    async ({ message, forwardedFrom, parentMessageId }: Payload) => {
      if (!publicKey || !privateKey || !destinationPublicKey) {
        throw new Error(
          "[Chat][Nostr] – attempting to send direct message with no private, destination or public key",
        );
      }

      const encryptedMessage = await nip04.encrypt(
        ownerPrivateKey,
        destinationPublicKey,
        message,
      );
      const tagsBuilder = MessagesManagement.MessagesTagsBuilder.shared
        .withDestination(destinationPublicKey)
        .withForwardedFrom(forwardedFrom)
        .withReferenceTo(parentMessageId);

      if (parent) {
        const relay = await findHealthyRelay(parent);
        if (relay) {
          tagsBuilder.withRoot(parent, relay);
        }
      }

      const event = await publishEncryptedMessage({
        tags: tagsBuilder.build(),
        eventMetadata: encryptedMessage,
      });
      return convertEvent<Kind.EncryptedDirectMessage>(
        event,
        publicKey,
        privateKey,
      )!!;
    },
  );
}
