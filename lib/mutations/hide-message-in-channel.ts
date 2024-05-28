import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Channel, NostrQueries, useNostrPublishMutation } from "../nostr";
import { Kind } from "nostr-tools";
import { ChatQueries } from "../queries";
import { useContext } from "react";
import { ChatContext } from "../chat-context-provider";

interface Payload {
  messageId: string;
  reason?: string;
  status: 0 | 1; //0 is hidden 1 is shown
}

/**
 * Use to hide specific user's message by community team member
 * @note Only community team member's mute event will be applied in messages query.
 *       All other event owners will be ignored
 * @param channel Current channel
 */
export function useHideMessageInChannel(channel?: Channel) {
  const queryClient = useQueryClient();
  const { activeUsername } = useContext(ChatContext);

  const hideMessageRequest = useNostrPublishMutation(
    ["chats", "hide-message", channel?.name],
    Kind.ChannelHideMessage,
    () => {},
  );

  return useMutation({
    mutationKey: ["chats/hide-message-in-channel", channel?.name],
    mutationFn: async ({ messageId, reason, status }: Payload) => {
      await hideMessageRequest.mutateAsync({
        eventMetadata: JSON.stringify({
          reason: reason ?? "Hidden by community team",
        }),
        tags: [
          ["e", messageId],
          ["e", channel!.id],
          ["status", status.toString()],
        ],
      });
      return { messageId, status };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [
          ChatQueries.HIDDEN_CHANNEL_MESSAGES,
          activeUsername,
          channel?.id,
        ],
      });
      await queryClient.invalidateQueries({
        queryKey: [NostrQueries.PUBLIC_MESSAGES, activeUsername, channel?.id],
      });
    },
  });
}
