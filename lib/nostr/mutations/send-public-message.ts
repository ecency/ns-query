import { useNostrPublishMutation } from "../core";
import { useMutation } from "@tanstack/react-query";
import { useFindHealthyRelayQuery } from "./find-healthy-relay";
import { convertEvent } from "../utils/event-converter";
import { Kind } from "nostr-tools";
import { MessagesManagement } from "../utils";

interface Payload {
  message: string;
  mentions?: string[];
  forwardedFrom?: string;
  parentMessageId?: string;
}

export function useNostrSendPublicMessage(channelId?: string, parent?: string) {
  const { mutateAsync: publishChannelMessage } = useNostrPublishMutation(
    ["chats/nostr-publish-channel-message"],
    Kind.ChannelMessage,
    () => {},
  );
  const { mutateAsync: findHealthyRelay } = useFindHealthyRelayQuery();

  return useMutation({
    mutationKey: ["chats/send-public-message"],
    mutationFn: async ({
      message,
      forwardedFrom,
      parentMessageId,
    }: Payload) => {
      const root = parent || channelId;

      if (!root) {
        throw new Error(
          "[Chat][Nostr] – trying to send public message to not existing channel",
        );
      }

      const relay = await findHealthyRelay(root);

      const tagsBuilder = MessagesManagement.MessagesTagsBuilder.shared
        .withForwardedFrom(forwardedFrom)
        .withReferenceTo(parentMessageId);

      if (relay) {
        tagsBuilder.withRoot(root, relay);
      }

      const event = await publishChannelMessage({
        tags: tagsBuilder.build(),
        eventMetadata: message,
      });
      return convertEvent<Kind.ChannelMessage>(event)!!;
    },
  });
}
