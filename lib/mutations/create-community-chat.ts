import { useMutation } from "@tanstack/react-query";
import { useNostrPublishMutation } from "../nostr";
import { Kind } from "nostr-tools";
import { KindOfCommunity } from "../types";
import { useAddChannelToEcency, useGetCommunityChannelQuery } from "../api";
import { useCommunityChannelQuery } from "../queries";

/**
 * A custom React Query hook for creating a chat channel within a community.
 * This hook allows you to create a chat channel associated with a specific community.
 * @note only ecency official account able to create a community channel
 */
export function useCreateCommunityChat(community: KindOfCommunity) {
  const getCommunityChannelQuery = useGetCommunityChannelQuery(community?.name);
  const communityChannelQuery = useCommunityChannelQuery(community);

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
          about: "Ecency community channel",
          communityName: community.name,
          picture: "",
          communityModerators: community.team.map(([name, role]) => ({
            name,
            role,
          })),
        },
        tags: [],
      });
      console.debug("[ns-query] Created a channel for", community.name, data);

      // Step 2: Add channel to Ecency
      return addToEcency({
        channel_id: data.id,
        meta: {},
        username: community.name,
      });
    },
    {
      onSuccess: async () => {
        await getCommunityChannelQuery.refetch();
        await communityChannelQuery.refetch();
      },
    },
  );
}
