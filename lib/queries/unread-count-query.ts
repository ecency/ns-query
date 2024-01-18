import { Channel, DirectContact, useKeysQuery } from "../nostr";
import { useMessagesQuery } from "./messages-query";
import { useMemo } from "react";
import { isAfter } from "date-fns";

export function useUnreadCountQuery(
  contact?: DirectContact,
  channel?: Channel,
) {
  const { data: messages } = useMessagesQuery(contact, channel);
  const { publicKey } = useKeysQuery();

  return useMemo(() => {
    const lastSeenDate = contact?.lastSeenDate;
    let unreadCount = messages.length;
    if (lastSeenDate) {
      const firstMessageAfterLastSeenDate = messages.findIndex(
        (m) =>
          isAfter(new Date(m.created * 1000), lastSeenDate) &&
          m.creator !== publicKey,
      );
      if (firstMessageAfterLastSeenDate > -1) {
        unreadCount = messages.length - firstMessageAfterLastSeenDate;
      } else {
        // If there aren't any message fresher than last seen date then room marking as read
        unreadCount = 0;
      }
    }
    return unreadCount > 10 ? "10+" : unreadCount;
  }, [messages, contact, channel]);
}
