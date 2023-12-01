import { useQuery } from "@tanstack/react-query";
import { ChatQueries } from "./queries";
import { getProfileMetaData } from "../utils";
import { AccountData, Channel } from "../nostr";

/**
 * Get the community's channel information
 * @see {@link ../mutations/create-community-chat.ts}
 */
export function useCommunityChannelQuery(
  community?: { name: string },
  account?: AccountData,
) {
  return useQuery<Channel>(
    [ChatQueries.COMMUNITY_CHANNEL, community?.name],
    async () => {
      if (!community) {
        return undefined;
      }

      const communityProfile = await getProfileMetaData(account!!);
      return communityProfile.channel;
    },
    {
      enabled: !!community && !!account,
    },
  );
}
