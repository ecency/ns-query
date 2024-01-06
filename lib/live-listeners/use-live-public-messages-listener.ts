import {
  Message,
  NostrQueries,
  PublicMessage,
  useKeysQuery,
  useLiveListener,
} from "../nostr";
import { Kind } from "nostr-tools";
import { convertEvent } from "../nostr/utils/event-converter";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { ChatQueries, useChannelsQuery } from "../queries";
import { useContext } from "react";
import { ChatContext } from "../chat-context-provider";

export function useLivePublicMessagesListener() {
  const queryClient = useQueryClient();

  const { activeUsername } = useContext(ChatContext);
  const { publicKey, privateKey } = useKeysQuery();
  const { data: channels } = useChannelsQuery();

  useLiveListener<Message>(
    (channels ?? []).map((channel) => ({
      kinds: [Kind.ChannelMessage],
      "#e": [channel.id],
    })),
    (event) =>
      convertEvent<Kind.ChannelMessage>(event, publicKey!!, privateKey!!)!!,
    async (message) => {
      if (!message) {
        return;
      }
      const channel = channels?.find((ch) => ch.id === message.root);

      if (!channel) {
        return;
      }

      const previousData = queryClient.getQueryData<
        InfiniteData<PublicMessage[]>
      >([NostrQueries.PUBLIC_MESSAGES, activeUsername, channel.id]);

      if (previousData) {
        const dump: InfiniteData<PublicMessage[]> = {
          ...previousData,
          pages: [...previousData.pages],
        };

        // Ignore duplicates
        if (dump.pages[0].some((m) => m.id === message.id)) {
          return;
        }

        dump.pages[0] = [...dump.pages[0], message as PublicMessage];
        queryClient.setQueryData(
          [NostrQueries.PUBLIC_MESSAGES, activeUsername, channel.id],
          dump,
        );
        await queryClient.invalidateQueries([
          ChatQueries.MESSAGES,
          activeUsername,
          channel.id,
        ]);
      }

      await queryClient.invalidateQueries([
        ChatQueries.LAST_MESSAGE,
        activeUsername,
        channel.id,
      ]);
    },
    { enabled: !!publicKey && !!privateKey },
  );
}
