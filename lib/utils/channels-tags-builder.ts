import { Profile } from "../nostr";

export namespace ChannelsTagsBuilder {
  export function buildLastSeenTags(
    profile: Profile,
    channelId: string,
    lastSeenDate: Date,
  ) {
    const lastSeenRecords = profile.channelsLastSeenDate ?? {};
    lastSeenRecords[channelId] = lastSeenDate;

    return Object.entries(lastSeenRecords).map(([channelId, lastSeenTime]) =>
      buildLastSeenTag(channelId, lastSeenTime),
    );
  }

  export function buildLastSeenTag(channelId: string, lastSeenTime: Date) {
    return ["lastSeenDate", channelId, lastSeenTime.getTime().toString()];
  }
}
