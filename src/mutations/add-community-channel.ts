import {
  NostrContext,
  useNostrFetchMutation,
  useUpdateLeftChannels,
} from "../nostr";
import { convertEvent } from "../nostr/utils/event-converter";
import { ChatQueries, useChannelsQuery } from "../queries";
import { useQueryClient } from "@tanstack/react-query";
import { useLeftCommunityChannelsQuery } from "../queries/left-community-channels-query";
import { Kind } from "nostr-tools";
import { useContext } from "react";

export function useAddCommunityChannel(id: string | undefined) {
  const { activeUsername } = useContext(NostrContext);
  const { data: channels } = useChannelsQuery();
  const queryClient = useQueryClient();

  const { data: leftCommunityChannelsIds } = useLeftCommunityChannelsQuery();
  const { mutateAsync: updateLeftChannels } = useUpdateLeftChannels();

  return useNostrFetchMutation(
    ["chats/add-community-channel"],
    [
      {
        kinds: [Kind.ChannelCreation],
        ids: id ? [id] : undefined,
      },
    ],
    {
      onSuccess: (events) => {
        events.forEach((event) => {
          switch (event.kind) {
            case Kind.ChannelCreation:
              const channel = convertEvent<Kind.ChannelCreation>(event);
              const hasChannelAlready = channels?.some(
                ({ id }) => id === channel?.id,
              );
              if (!hasChannelAlready && channel) {
                queryClient.setQueryData(
                  [ChatQueries.CHANNELS, activeUsername],
                  [...(channels ?? []), channel],
                );
              }

              // Remove the community from left list
              updateLeftChannels({
                tags: [["d", "left-channel-list"]],
                eventMetadata: JSON.stringify(
                  leftCommunityChannelsIds?.filter((id) => id !== id) ?? [],
                ),
              });
          }
        });
      },
    },
  );
}
