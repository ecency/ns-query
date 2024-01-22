import { useUpdateCommunityChannel } from "./update-community-channel";
import { useMutation } from "@tanstack/react-query";
import { Channel } from "../nostr";

// TODO: use special event for it
export function useUpdateChannelBlockedUsers(channel: Channel) {
  const { mutateAsync: updateChannel } = useUpdateCommunityChannel(channel);

  return useMutation(
    ["chats/update-channel-blocked-users", channel?.communityName],
    async (users: string[]) => {
      if (!channel) {
        console.error("[Chat][Nostr] – trying to update not existing channel");
        return;
      }

      const newUpdatedChannel: Channel = { ...channel };

      // newUpdatedChannel.removedUserIds = users;

      return updateChannel(newUpdatedChannel);
    },
  );
}
