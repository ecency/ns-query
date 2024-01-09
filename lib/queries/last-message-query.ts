import {
  Channel,
  DirectContact,
  useDirectMessagesQuery,
  usePublicMessagesQuery,
} from "../nostr";
import { useContext, useEffect, useMemo } from "react";
import { ChatContext } from "../chat-context-provider";
import { useQueryClient } from "@tanstack/react-query";
import { ChatQueries } from "./queries";

export function useLastMessageQuery(
  contact?: DirectContact,
  channel?: Channel,
) {
  const { activeUsername } = useContext(ChatContext);
  const queryClient = useQueryClient();

  const { data: lastDirectMessages, refetch: refetchDirectMessages } =
    useDirectMessagesQuery(contact);
  const { data: lastPublicMessages, refetch: refetchPublicMessages } =
    usePublicMessagesQuery(channel);

  useEffect(() => {
    refetchDirectMessages();
  }, [contact]);

  useEffect(() => {
    refetchPublicMessages();
  }, [channel]);

  const lastDirectMessage = useMemo(() => {
    const lastDirectMessage = lastDirectMessages?.pages?.[0]?.[0];
    if (lastDirectMessage && channel) {
      queryClient.setQueryData(
        [ChatQueries.LAST_MESSAGE, activeUsername, contact?.pubkey],
        lastDirectMessage,
      );
    }
    return lastDirectMessage;
  }, [lastDirectMessages, contact]);

  const lastPublicMessage = useMemo(() => {
    const lastPublicMessage = lastPublicMessages?.pages?.[0]?.[0];
    if (lastPublicMessage && channel) {
      queryClient.setQueryData(
        [ChatQueries.LAST_MESSAGE, activeUsername, channel?.id],
        lastPublicMessage,
      );
    }
    return lastPublicMessage;
  }, [lastPublicMessages, channel]);

  return lastPublicMessage ?? lastDirectMessage;
}
