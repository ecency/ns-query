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
import { useChannelsQuery } from "../queries";
import { useContext, useMemo } from "react";
import { ChatContext } from "../chat-context-provider";
import { InfiniteQueryDataUtil } from "../utils";

export function useLivePublicMessagesListener() {
  const queryClient = useQueryClient();

  const { activeUsername } = useContext(ChatContext);
  const { publicKey, privateKey } = useKeysQuery();
  const { data: channels } = useChannelsQuery();
  const filters = useMemo(
    () =>
      (channels ?? []).map((channel) => ({
        kinds: [Kind.ChannelMessage],
        "#e": [channel.id],
      })),
    [channels],
  );

  useLiveListener<Message>(
    filters,
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

      queryClient.setQueryData<InfiniteData<PublicMessage[]>>(
        [NostrQueries.PUBLIC_MESSAGES, activeUsername, channel.id],
        (data) =>
          InfiniteQueryDataUtil.safeDataUpdate(data, (d) =>
            InfiniteQueryDataUtil.pushElementToFirstPage(
              d,
              message as PublicMessage,
              (m) => m.id === message.id,
            ),
          ),
      );
      await queryClient.invalidateQueries([
        NostrQueries.PUBLIC_MESSAGES,
        activeUsername,
        channel.id,
      ]);
    },
    { enabled: !!publicKey && !!privateKey },
  );
}
