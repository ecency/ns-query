import { useMutation } from "@tanstack/react-query";
import { Channel, useNostrPublishMutation } from "../nostr";
import { Kind } from "nostr-tools";

interface Payload {
  pubkey: string;
  reason?: string;
}

/**
 * Use to mute/block specific user messages by community team member
 * @note Only community team member's mute event will be applied in messages query.
 *       All other event owners will be ignored
 * @param channel Current channel
 */
export function useMuteUserInChannel(channel?: Channel) {
  const muteUserRequest = useNostrPublishMutation(
    ["chats", "mute-user", channel?.name],
    Kind.ChannelMuteUser,
    () => {},
  );

  return useMutation(
    ["chats/mute-user-in-channel", channel?.name],
    async ({ pubkey, reason }: Payload) => {
      await muteUserRequest.mutateAsync(
        {
          eventMetadata: JSON.stringify({
            reason: reason ?? "Muted by community team",
          }),
          tags: [
            ["p", pubkey],
            ["e", channel!.id, "channel"],
          ],
        },
        {
          onSuccess: () => {
            // todo invalidate messages query or filter out blocked user manually
          },
        },
      );
    },
  );
}
