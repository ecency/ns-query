import { useMemo } from "react";
import { useJoinedChannelsQuery } from "./joined-channels-query";
import { useCreatedChannelsQuery } from "./created-channels-query";

export function useChannelsQuery() {
  const { data: createdChannels } = useCreatedChannelsQuery();
  const { data: joinedChannels } = useJoinedChannelsQuery();

  return useMemo(
    () => ({
      data: [...(createdChannels ?? []), ...(joinedChannels ?? [])],
    }),
    [createdChannels, joinedChannels],
  );
}
