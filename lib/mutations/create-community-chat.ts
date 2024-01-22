import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNostrPublishMutation } from "../nostr";
import { Kind } from "nostr-tools";
import { KindOfCommunity } from "../types";
import { useAddChannelToEcency } from "../api";
import { ChatQueries } from "../queries";
import { convertEvent } from "../nostr/utils/event-converter";

/**
 * A custom React Query hook for creating a chat channel within a community.
 * This hook allows you to create a chat channel associated with a specific community.
 * @note only ecency official account able to create a community channel
 */
export function useCreateCommunityChat(community: KindOfCommunity) {
  const queryClient = useQueryClient();

  const { mutateAsync: createChannel } = useNostrPublishMutation(
    ["chats/nostr-create-channel"],
    Kind.ChannelCreation,
    () => {},
    {},
  );
  const { mutateAsync: addToEcency } = useAddChannelToEcency();

  return useMutation(
    ["chats/create-community-chat"],
    async () => {
      console.debug(
        "[ns-query] Attempting to create a channel for",
        community.name,
      );
      // Step 1: Create a chat channel using the `createChannel` mutation.
      const data = await createChannel({
        eventMetadata: {
          name: community.title,
          about: "Ecency app community channel",
          communityName: community.name,
          picture: "",
        },
        tags: [],
      });
      console.debug("[ns-query] Created a channel for", community.name, data);

      // Step 2: Add channel to Ecency
      const ecencyChannel = await addToEcency({
        channel_id: data.id,
        meta: {},
        username: community.name,
      });

      return [convertEvent<Kind.ChannelCreation>(data), ecencyChannel] as const;
    },
    {
      onSuccess: async ([channel, ecencyChannel]) => {
        if (channel) {
          queryClient.setQueryData(
            [ChatQueries.COMMUNITY_CHANNEL, channel.communityName],
            channel,
          );
          queryClient.setQueryData(
            ["private-api", "get-community-channel", channel.communityName],
            ecencyChannel,
          );
        }
      },
    },
  );
}
