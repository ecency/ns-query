import {
  Channel,
  DirectContact,
  useDirectMessagesQuery,
  usePublicMessagesQuery,
} from "../nostr";
import { useEffect, useMemo } from "react";
import { useMessagesQuery } from "./messages-query";

export function useLastMessageQuery(
  contact?: DirectContact,
  channel?: Channel,
) {
  const { refetch: refetchDirectMessages } = useDirectMessagesQuery(contact);
  const { refetch: refetchPublicMessages } = usePublicMessagesQuery(channel);
  const { data: messages } = useMessagesQuery(contact, channel);

  useEffect(() => {
    refetchDirectMessages();
  }, [contact]);

  useEffect(() => {
    refetchPublicMessages();
  }, [channel]);

  return useMemo(() => messages[messages.length - 1], [messages]);
}
