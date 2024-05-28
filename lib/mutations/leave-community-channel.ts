import {
  Channel,
  useKeysQuery,
  useNostrGetUserProfileQuery,
  useNostrPublishMutation,
} from "../nostr";
import { ChatQueries } from "../queries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Kind } from "nostr-tools";
import { useContext } from "react";
import { ChatContext } from "../chat-context-provider";

export function useLeaveCommunityChannel(channel?: Channel) {
  const { activeUsername } = useContext(ChatContext);
  const queryClient = useQueryClient();

  const { publicKey } = useKeysQuery();
  const { data: activeUserNostrProfiles } =
    useNostrGetUserProfileQuery(publicKey);
  const { mutateAsync: updateProfile } = useNostrPublishMutation(
    ["chats/update-nostr-profile"],
    Kind.Metadata,
    () => {},
  );

  return useMutation({
    mutationKey: ["chats/leave-community-channel"],
    mutationFn: async () => {
      console.debug("[ns-query] Attempting to leave channel", channel);
      if (channel && activeUserNostrProfiles) {
        const activeUserNostrProfile = activeUserNostrProfiles[0];

        const lastSeenRecords =
          activeUserNostrProfile.channelsLastSeenDate ?? {};
        const lastSeenTags = Object.entries(lastSeenRecords).map(
          ([channelId, lastSeenTime]) => [
            "lastSeenDate",
            channelId,
            lastSeenTime.getTime().toString(),
          ],
        );

        await updateProfile({
          tags: [["p", publicKey!!], ...lastSeenTags],
          eventMetadata: {
            ...activeUserNostrProfile,
            joinedChannels: (
              activeUserNostrProfile.joinedChannels ?? []
            ).filter((c) => c !== channel.id),
          },
        });
        console.debug("[ns-query] Joined channels list updated. Channel left.");
        await queryClient.invalidateQueries({
          queryKey: ["chats/nostr-get-user-profile", publicKey],
        });
        queryClient.setQueryData(
          [ChatQueries.ORIGINAL_JOINED_CHANNELS, activeUsername],
          (
            queryClient.getQueryData<Channel[]>([
              ChatQueries.ORIGINAL_JOINED_CHANNELS,
              activeUsername,
            ]) ?? []
          ).filter((c) => c.id !== channel.id),
        );
        queryClient.setQueryData(
          [ChatQueries.JOINED_CHANNELS, activeUsername],
          (
            queryClient.getQueryData<Channel[]>([
              ChatQueries.JOINED_CHANNELS,
              activeUsername,
            ]) ?? []
          ).filter((c) => c.id !== channel.id),
        );
      }
    },
  });
}
