import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Channel, NostrQueries, useNostrPublishMutation } from "../nostr";
import { Kind } from "nostr-tools";
import { useContext } from "react";
import { ChatContext } from "../chat-context-provider";
import { ChatQueries } from "../queries";

interface Payload {
  pubkey: string;
  reason?: string;
  status: 0 | 1; // 0 is muted 1 is unmuted
}

/**
 * Use to mute/block specific user messages by community team member
 * @note Only community team member's mute event will be applied in messages query.
 *       All other event owners will be ignored
 * @param channel Current channel
 */
export function useMuteUserInChannel(channel?: Channel) {
  const queryClient = useQueryClient();
  const { activeUsername } = useContext(ChatContext);
  const muteUserRequest = useNostrPublishMutation(
    ["chats", "mute-user", channel?.name],
    Kind.ChannelMuteUser,
    () => {},
  );

  return useMutation({
    mutationKey: ["chats/mute-user-in-channel", channel?.name],
    mutationFn: async ({ pubkey, reason, status }: Payload) => {
      await muteUserRequest.mutateAsync({
        eventMetadata: JSON.stringify({
          reason: reason ?? "Muted by community team",
        }),
        tags: [
          ["p", pubkey],
          ["e", channel!.id, "channel"],
          ["status", status.toString()],
        ],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [NostrQueries.PUBLIC_MESSAGES, activeUsername, channel?.id],
      });
      queryClient.invalidateQueries({
        queryKey: [ChatQueries.BLOCKED_USERS, activeUsername, channel?.id],
      });
    },
  });
}
