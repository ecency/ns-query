import {
  DirectMessage,
  Message,
  NostrQueries,
  PublicMessage,
} from "../../nostr";
import { InfiniteData, QueryClient } from "@tanstack/react-query";
import { InfiniteQueryDataUtil } from "../../utils";

export function updateMessageStatusInQuery(
  queryClient: QueryClient,
  message: Message | undefined,
  status: number,
  activeUsername: string | undefined,
  destination: string | undefined,
) {
  if (!message) {
    return;
  }

  if ("decrypted" in message) {
    queryClient.setQueryData<InfiniteData<DirectMessage[]>>(
      [NostrQueries.DIRECT_MESSAGES, activeUsername, destination],
      (data) =>
        InfiniteQueryDataUtil.safeDataUpdate(data, (d) =>
          InfiniteQueryDataUtil.replaceElementByIndexes(
            d,
            (m) => m.id === message.id,
            (m) => {
              m.sent = status;
              return m;
            },
          ),
        ),
    );
  } else {
    queryClient.setQueryData<InfiniteData<PublicMessage[]>>(
      [NostrQueries.PUBLIC_MESSAGES, activeUsername, destination],
      (data) =>
        InfiniteQueryDataUtil.safeDataUpdate(data, (d) =>
          InfiniteQueryDataUtil.replaceElementByIndexes(
            d,
            (m) => m.id === message.id,
            (m) => {
              m.sent = status;
              return m;
            },
          ),
        ),
    );
  }
}
