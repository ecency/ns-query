import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AccountData, NostrContext, useNostrPublishMutation } from "../nostr";
import { ChatQueries, useNostrJoinedCommunityTeamQuery } from "../queries";
import { useContext } from "react";
import { Kind } from "vicev-nostr-tools";
import { KindOfCommunity } from "../types";

/**
 * A custom React Query hook for creating a chat channel within a community.
 * This hook allows you to create a chat channel associated with a specific community.
 */
export function useCreateCommunityChat(
  community: KindOfCommunity,
  communityAccountData: AccountData,
  updateCommunityAccountProfile: (
    data: AccountData,
    nextData: AccountData,
  ) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  const { activeUsername } = useContext(NostrContext);

  const { data: communityTeam } = useNostrJoinedCommunityTeamQuery(
    community,
    communityAccountData,
  );
  const { mutateAsync: createChannel } = useNostrPublishMutation(
    ["chats/nostr-create-channel"],
    Kind.ChannelCreation,
    () => {},
    {},
  );

  return useMutation(
    ["chats/create-community-chat"],
    async () => {
      // Step 1: Create a chat channel using the `createChannel` mutation.
      const data = await createChannel({
        eventMetadata: {
          name: community.title,
          about: community.description,
          communityName: community.name,
          picture: "",
          communityModerators: communityTeam,
          hiddenMessageIds: [],
          removedUserIds: [],
        },
        tags: [],
      });

      // Step 2: Extract and format channel metadata from the response.
      const content = JSON.parse(data?.content!);
      const channelMetaData = {
        id: data?.id as string,
        creator: data?.pubkey as string,
        created: data?.created_at!,
        communityName: content.communityName,
        name: content.name,
        about: content.about,
        picture: content.picture,
      };

      // Step 3: Retrieve the user's profile information.
      const { posting_json_metadata } = communityAccountData;

      // Step 4: Update the user's profile with the new channel information.
      const profile = JSON.parse(posting_json_metadata!).profile;
      const newProfile = {
        channel: channelMetaData,
      };

      return await updateCommunityAccountProfile(communityAccountData, {
        ...profile,
        ...newProfile,
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([ChatQueries.CHANNELS, activeUsername]);
      },
    },
  );
}
