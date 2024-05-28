import { Kind } from "nostr-tools";
import {
  Channel,
  Profile,
  useKeysQuery,
  useNostrGetUserProfileQuery,
  useNostrPublishMutation,
} from "../nostr";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChannelsTagsBuilder } from "../utils";

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

  return useMutation({
    mutationKey: ["chats/nostr-update-channel-last-seen-date"],
    mutationFn: async ({
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
      if (!profile) {
        throw new Error(
          "[ns-query] Could not find active user profile in Nostr",
        );
      }

      const lastSeenRecords = profile.channelsLastSeenDate ?? {};
      lastSeenRecords[channel.id] = lastSeenDate;

      const lastSeenTags = ChannelsTagsBuilder.buildLastSeenTags(
        profile,
        channel.id,
        lastSeenDate,
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
    },
    onSuccess: (lastSeenRecords) => {
      if (!lastSeenRecords) {
        return;
      }
      queryClient.setQueryData<Profile[] | undefined>(
        ["chats/nostr-get-user-profile", publicKey],
        (data) => {
          if (!data) {
            return data;
          }

          return [
            {
              ...data[0],
              channelsLastSeenDate: lastSeenRecords,
            },
          ];
        },
      );
    },
  });
}
