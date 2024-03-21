import { useNostrPublishMutation } from "../core";
import { useMutation } from "@tanstack/react-query";
import { useFindHealthyRelayQuery } from "./find-healthy-relay";
import { convertEvent } from "../utils/event-converter";
import { Kind } from "nostr-tools";

interface Payload {
  message: string;
  mentions?: string[];
  forwardedFrom?: string;
}

export function useNostrSendPublicMessage(channelId?: string, parent?: string) {
  const { mutateAsync: publishChannelMessage } = useNostrPublishMutation(
    ["chats/nostr-publish-channel-message"],
    Kind.ChannelMessage,
    () => {},
  );
  const { mutateAsync: findHealthyRelay } = useFindHealthyRelayQuery();

  return useMutation(
    ["chats/send-public-message"],
    async ({ message, mentions, forwardedFrom }: Payload) => {
      const root = parent || channelId;

      if (!root) {
        throw new Error(
          "[Chat][Nostr] – trying to send public message to not existing channel",
        );
      }

      const relay = await findHealthyRelay(root);

      const tags: string[][] = [];
      if (relay) {
        tags.push(["e", root, relay, "root"]);
      }

      if (mentions) {
        mentions.forEach((m) => tags.push(["p", m]));
      }

      if (forwardedFrom) {
        tags.push(["fwd", forwardedFrom]);
      }

      const event = await publishChannelMessage({
        tags,
        eventMetadata: message,
      });
      return convertEvent<Kind.ChannelMessage>(event)!!;
    },
  );
}
