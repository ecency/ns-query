import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatQueries, useChannelsQuery } from "../queries";
import { Channel, NostrContext, useNostrPublishMutation } from "../nostr";
import { useFindHealthyRelayQuery } from "../nostr/mutations/find-healthy-relay";
import { useContext } from "react";
import { Kind } from "nostr-tools";

export function useUpdateCommunityChannel(channel?: Channel) {
  const queryClient = useQueryClient();
  const { data: channels } = useChannelsQuery();
  const { activeUsername } = useContext(NostrContext);

  const { mutateAsync: updateChannel } = useNostrPublishMutation(
    ["chats/nostr-update-channel", channel?.communityName],
    Kind.ChannelMetadata,
    () => {},
  );
  const { mutateAsync: findHealthyRelay } = useFindHealthyRelayQuery();

  return useMutation(
    ["chats/update-community-channel", channel?.communityName],
    async (newUpdatedChannel: Channel) => {
      if (!channel) {
        return;
      }

      const relay = await findHealthyRelay(channel.id);

      await updateChannel({
        tags: [["e", channel.id, ...(relay ? [relay] : [])]],
        eventMetadata: JSON.stringify(newUpdatedChannel),
      });

      return newUpdatedChannel;
    },
    {
      onSuccess: (updatedChannel) => {
        if (!updatedChannel) {
          return;
        }

        const tempChannels = [...(channels ?? [])];
        const index = tempChannels.findIndex(
          (ch) => ch.id === updatedChannel?.id,
        );
        tempChannels[index] = updatedChannel;

        queryClient.setQueryData(
          [ChatQueries.CHANNELS, activeUsername],
          tempChannels,
        );
      },
    },
  );
}