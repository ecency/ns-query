import { useMemo } from "react";
import { useJoinedChannelsQuery } from "./joined-channels-query";

export function useChannelsQuery() {
  const { data: joinedChannels } = useJoinedChannelsQuery();

  return useMemo(
    () => ({
      data: [...(joinedChannels ?? [])],
    }),
    [joinedChannels],
  );
}
