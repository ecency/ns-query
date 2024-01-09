import {
  Channel,
  useKeysQuery,
  useNostrGetUserProfileQuery,
  useNostrPublishMutation,
  useUpdateLeftChannels,
} from "../nostr";
import {
  ChatQueries,
  useChannelsQuery,
  useLeftCommunityChannelsQuery,
} from "../queries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Kind } from "nostr-tools";
import { useContext } from "react";
import { ChatContext } from "../chat-context-provider";

export function useAddCommunityChannel(channel?: Channel) {
  const { activeUsername } = useContext(ChatContext);
  const { data: channels } = useChannelsQuery();
  const queryClient = useQueryClient();

  const { publicKey } = useKeysQuery();
  const { data: activeUserNostrProfiles } =
    useNostrGetUserProfileQuery(publicKey);
  const { data: leftCommunityChannelsIds } = useLeftCommunityChannelsQuery();
  const { mutateAsync: updateLeftChannels } = useUpdateLeftChannels();
  const { mutateAsync: updateProfile } = useNostrPublishMutation(
    ["chats/update-nostr-profile"],
    Kind.Metadata,
    () => {},
  );

  return useMutation(["chats/add-community-channel"], async () => {
    const hasChannelAlready = channels?.some(({ id }) => id === channel?.id);
    if (!hasChannelAlready && channel && activeUserNostrProfiles) {
      queryClient.setQueryData(
        [ChatQueries.CHANNELS, activeUsername],
        [...(channels ?? []), channel],
      );
      const activeUserNostrProfile = activeUserNostrProfiles[0];
      await updateProfile({
        tags: [["p", publicKey!!]],
        eventMetadata: {
          ...activeUserNostrProfile,
          joinedChannels: [
            ...(activeUserNostrProfile.joinedChannels ?? []),
            channel.id,
          ],
        },
      });
      await queryClient.invalidateQueries([
        ["chats/nostr-get-user-profile", publicKey],
      ]);
      await queryClient.invalidateQueries([
        ChatQueries.JOINED_CHANNELS,
        activeUsername,
      ]);

      // Remove the community from left list
      await updateLeftChannels({
        tags: [["d", "left-channel-list"]],
        eventMetadata: JSON.stringify(
          leftCommunityChannelsIds?.filter((id) => id !== id) ?? [],
        ),
      });
    }
  });
}
