import {
  DirectMessage,
  Message,
  NostrQueries,
  PublicMessage,
  useKeysQuery,
  useLiveListener,
} from "../nostr";
import { Kind } from "nostr-tools";
import { convertEvent } from "../nostr/utils/event-converter";
import { useQueryClient } from "@tanstack/react-query";
import { ChatQueries, useChannelsQuery } from "../queries";
import { useContext } from "react";
import { ChatContext } from "../chat-context-provider";

export function useLivePublicMessagesListener() {
  const queryClient = useQueryClient();

  const { activeUsername } = useContext(ChatContext);
  const { publicKey, privateKey } = useKeysQuery();
  const { data: channels } = useChannelsQuery();

  useLiveListener<Message | null>(
    (channels ?? []).map((channel) => ({
      kinds: [Kind.ChannelMessage],
      "#e": [channel.id],
    })),
    (event) =>
      convertEvent<Kind.ChannelMessage>(event, publicKey!!, privateKey!!),
    async (message) => {
      if (!message) {
        return;
      }
      const channel = channels?.find((ch) => ch.id === message.root);

      if (!channel) {
        return;
      }

      const directMessage = message as DirectMessage;
      const previousData = queryClient.getQueryData<PublicMessage[]>([
        NostrQueries.PUBLIC_MESSAGES,
        activeUsername,
        channel.id,
      ]);

      if (previousData?.some((m) => m.id === directMessage.id)) {
        return;
      }

      queryClient.setQueryData(
        [NostrQueries.PUBLIC_MESSAGES, activeUsername, channel.id],
        [...(previousData ?? []), directMessage],
      );
      queryClient.setQueryData(
        [ChatQueries.LAST_MESSAGE, activeUsername, channel.id],
        message,
      );
      await queryClient.invalidateQueries([
        NostrQueries.PUBLIC_MESSAGES,
        activeUsername,
        channel.id,
      ]);
      await queryClient.invalidateQueries([
        ChatQueries.LAST_MESSAGE,
        activeUsername,
        channel.id,
      ]);
    },
    { enabled: !!publicKey && !!privateKey },
  );
}
