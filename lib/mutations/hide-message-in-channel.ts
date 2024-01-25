import { useMutation } from "@tanstack/react-query";
import { Channel, useNostrPublishMutation } from "../nostr";
import { Kind } from "nostr-tools";

interface Payload {
  messageId: string;
  reason?: string;
}

/**
 * Use to hide specific user's message by community team member
 * @note Only community team member's mute event will be applied in messages query.
 *       All other event owners will be ignored
 * @param channel Current channel
 */
export function useHideMessageInChannel(channel?: Channel) {
  const hideMessageRequest = useNostrPublishMutation(
    ["chats", "hide-message", channel?.name],
    Kind.ChannelHideMessage,
    () => {},
  );

  return useMutation(
    ["chats/hide-message-in-channel", channel?.name],
    async ({ messageId, reason }: Payload) => {
      await hideMessageRequest.mutateAsync({
        eventMetadata: JSON.stringify({
          reason: reason ?? "Hidden by community team",
        }),
        tags: [["e", messageId]],
      });
    },
  );
}
