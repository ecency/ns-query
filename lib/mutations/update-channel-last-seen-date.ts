import { Kind } from "nostr-tools";
import {
  Channel,
  useKeysQuery,
  useNostrGetUserProfileQuery,
  useNostrPublishMutation,
} from "../nostr";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUpdateChannelLastSeenDate() {
  const queryClient = useQueryClient();

  const { publicKey } = useKeysQuery();
  const { data: activeUserNostrProfiles } =
    useNostrGetUserProfileQuery(publicKey);
  const { mutateAsync: updateProfile } = useNostrPublishMutation(
    ["chats/update-nostr-profile"],
    Kind.Metadata,
    () => {},
  );

  return useMutation(
    ["chats/nostr-update-channel-last-seen-date"],
    async ({
      channel,
      lastSeenDate,
    }: {
      channel: Channel;
      lastSeenDate: Date;
    }) => {
      console.debug(
        "[ns-query] Updating channel's last seen date",
        channel,
        lastSeenDate,
      );
      const profile = activeUserNostrProfiles?.[0];
      if (profile) {
        const lastSeenRecords = profile.channelsLastSeenDate ?? {};
        lastSeenRecords[channel.id] = lastSeenDate;

        const lastSeenTags = Object.entries(lastSeenRecords).map(
          ([channelId, lastSeenTime]) => [
            "lastSeenDate",
            channelId,
            lastSeenTime.getTime().toString(),
          ],
        );

        await updateProfile({
          tags: [["p", publicKey!!], ...lastSeenTags],
          eventMetadata: profile,
        });
        console.debug(
          "[ns-query] Channel's last seen date updated",
          channel,
          lastSeenDate,
        );

        return lastSeenRecords;
      }
      throw new Error("[ns-query] Could not find active user profile in Nostr");
    },
    {
      onSuccess: (lastSeenRecords) => {
        if (lastSeenRecords) {
          queryClient.setQueryData(
            ["chats/nostr-get-user-profile", publicKey],
            [
              {
                ...activeUserNostrProfiles?.[0],
                channelsLastSeenDate: lastSeenRecords,
              },
            ],
          );
        }
      },
    },
  );
}
