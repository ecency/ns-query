import {
  Channel,
  DirectContact,
  useKeysQuery,
  useNostrGetUserProfileQuery,
} from "../nostr";
import { useMessagesQuery } from "./messages-query";
import { useMemo } from "react";
import { isAfter } from "date-fns";

export function useUnreadCountQuery(
  contact?: DirectContact,
  channel?: Channel,
) {
  const { data: messages } = useMessagesQuery(contact, channel);
  const { publicKey } = useKeysQuery();
  const { data: activeUserNostrProfiles } =
    useNostrGetUserProfileQuery(publicKey);

  const computeUnread = (lastSeenDate: Date) => {
    const firstMessageAfterLastSeenDate = messages.findIndex(
      (m) =>
        isAfter(new Date(m.created * 1000), lastSeenDate) &&
        m.creator !== publicKey,
    );
    if (firstMessageAfterLastSeenDate > -1) {
      return messages.length - firstMessageAfterLastSeenDate;
    } else {
      // If there aren't any message fresher than last seen date then room marking as read
      return 0;
    }
  };

  const channelsUnreadCount = useMemo(() => {
    let unreadCount = messages.length;
    if (activeUserNostrProfiles?.[0] && channel) {
      const channelsLastSeenTimestamps =
        activeUserNostrProfiles?.[0].channelsLastSeenDate ?? {};
      const channelLastSeenTimestamp = channelsLastSeenTimestamps[channel.id];
      if (channelLastSeenTimestamp) {
        const date = new Date(+channelLastSeenTimestamp);
        unreadCount = computeUnread(date);
      }
    }
    return unreadCount > 10 ? "10+" : unreadCount;
  }, [channel, activeUserNostrProfiles, messages]);

  const directContactUnreadCount = useMemo(() => {
    const lastSeenDate = contact?.lastSeenDate;
    let unreadCount = messages.length;
    if (lastSeenDate) {
      unreadCount = computeUnread(lastSeenDate);
    }
    return unreadCount > 10 ? "10+" : unreadCount;
  }, [messages, contact]);

  return useMemo(
    () => (channel ? channelsUnreadCount : directContactUnreadCount),
    [channel, channelsUnreadCount, directContactUnreadCount],
  );
}
