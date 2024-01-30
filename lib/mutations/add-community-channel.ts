import {
  Channel,
  useKeysQuery,
  useNostrGetUserProfileQuery,
  useNostrPublishMutation,
} from "../nostr";
import { ChatQueries, useOriginalJoinedChannelsQuery } from "../queries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Kind } from "nostr-tools";
import { useContext } from "react";
import { ChatContext } from "../chat-context-provider";

export function useAddCommunityChannel(channel?: Channel) {
  const { activeUsername } = useContext(ChatContext);
  const { data: channels } = useOriginalJoinedChannelsQuery();
  const queryClient = useQueryClient();

  const { publicKey } = useKeysQuery();
  const { data: activeUserNostrProfiles } =
    useNostrGetUserProfileQuery(publicKey);
  const { mutateAsync: updateProfile } = useNostrPublishMutation(
    ["chats/update-nostr-profile"],
    Kind.Metadata,
    () => {},
  );

  return useMutation(["chats/add-community-channel"], async () => {
    console.debug("[ns-query] Attempting to add channel to list", channel);
    const hasChannelAlready = channels?.some(({ id }) => id === channel?.id);
    if (!hasChannelAlready && channel && activeUserNostrProfiles) {
      const activeUserNostrProfile = activeUserNostrProfiles[0];

      const lastSeenRecords = activeUserNostrProfile.channelsLastSeenDate ?? {};
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
          joinedChannels: [
            ...(activeUserNostrProfile.joinedChannels ?? []),
            channel.id,
          ],
        },
      });
      console.debug("[ns-query] Joined channels list updated. Channel added.");
      await queryClient.invalidateQueries([
        ["chats/nostr-get-user-profile", publicKey],
      ]);
      queryClient.setQueryData(
        [ChatQueries.ORIGINAL_JOINED_CHANNELS, activeUsername],
        [
          ...(queryClient.getQueryData<Channel[]>([
            ChatQueries.ORIGINAL_JOINED_CHANNELS,
            activeUsername,
          ]) ?? []),
          channel,
        ],
      );
      queryClient.setQueryData(
        [ChatQueries.JOINED_CHANNELS, activeUsername],
        [
          ...(
            queryClient.getQueryData<Channel[]>([
              ChatQueries.JOINED_CHANNELS,
              activeUsername,
            ]) ?? []
          )
            // Since We ecency-vision able to add channels to query manually then We have to keep them unique
            .filter((ch) => ch.id !== channel.id),
          channel,
        ],
      );
    }
  });
}
