import { ChatQueries } from "./queries";
import { Channel, useKeysQuery, useNostrFetchQuery } from "../nostr";
import { useGetCommunityChannelQuery } from "../api";
import { Kind } from "nostr-tools";
import { convertEvent } from "../nostr/utils/event-converter";
import { UseQueryResult } from "@tanstack/react-query";
import { useMount } from "react-use";

/**
 * Get the community's channel information
 * @note it marked as any because select function changes return type
 * @see {@link ../mutations/create-community-chat.ts}
 */
export function useCommunityChannelQuery(community?: {
  name: string;
}): UseQueryResult<Channel | undefined> {
  const { data: communityChannel, refetch: refetchCommunityChannel } =
    useGetCommunityChannelQuery(community?.name);
  const { hasKeys } = useKeysQuery();

  useMount(() => {
    if (!communityChannel) {
      refetchCommunityChannel();
    }
  });

  return useNostrFetchQuery<any>(
    [ChatQueries.COMMUNITY_CHANNEL, community?.name],
    [
      {
        kinds: [Kind.ChannelCreation],
        ids: [communityChannel?.channel_id ?? ""],
      },
    ],
    (events) =>
      events
        .map((event) => convertEvent<Kind.ChannelCreation>(event))
        .filter((channel) => !!channel) as Channel[],
    {
      initialData: [],
      enabled: hasKeys && !!communityChannel?.channel_id,
      select: (channels) => channels?.[0],
    },
  );
}
