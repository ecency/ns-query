import {
  Channel,
  DirectContact,
  Message,
  useDirectMessagesQuery,
  usePublicMessagesQuery,
} from "../nostr";
import { useMemo } from "react";
import { InfiniteQueryDataUtil } from "../utils";

/**
 * Hook for fetching message for specific contact or channel
 */
export function useMessagesQuery(
  currentContact?: DirectContact,
  currentChannel?: Channel,
) {
  const { data: directMessages } = useDirectMessagesQuery(currentContact);
  const { data: publicMessages } = usePublicMessagesQuery(currentChannel);

  return useMemo(() => {
    let messages: Message[] = [];
    if (!!currentChannel && publicMessages) {
      messages = InfiniteQueryDataUtil.flatten(publicMessages);
    } else if (!!currentContact && directMessages) {
      messages = InfiniteQueryDataUtil.flatten(directMessages);
    }

    return messages.sort((a, b) => a.created - b.created);
  }, [directMessages, publicMessages]);
}
