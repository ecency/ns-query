import { ChatQueries } from "./queries";
import {
  Channel,
  NostrContext,
  useKeysQuery,
  useNostrFetchQuery,
} from "../nostr";
import { Kind } from "nostr-tools";
import { convertEvent } from "../nostr/utils/event-converter";
import { useContext } from "react";

export function useChannelsQuery() {
  const { activeUsername } = useContext(NostrContext);
  const { hasKeys } = useKeysQuery();

  return useNostrFetchQuery<Channel[]>(
    [ChatQueries.CHANNELS, activeUsername],
    [Kind.ChannelCreation],
    (events) =>
      events
        .map((event) => convertEvent<Kind.ChannelCreation>(event))
        .filter((channel) => !!channel) as Channel[],
    {
      initialData: [],
      enabled: hasKeys,
      refetchOnMount: false,
    },
  );
}
