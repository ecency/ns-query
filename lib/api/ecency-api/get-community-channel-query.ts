import { useContext } from "react";
import { ChatContext } from "../../chat-context-provider";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function useGetCommunityChannelQuery(communityName?: string) {
  const { privateApiHost } = useContext(ChatContext);

  return useQuery(
    ["private-api", "get-community-channel", communityName],
    () =>
      axios
        .get<{
          channel_id: string;
          created: string;
          username: string;
          meta: any;
        }>(`${privateApiHost}/private-api/channel/${communityName}`)
        .then((resp) => resp.data),
    {
      enabled: !!communityName,
      refetchOnMount: false,
    },
  );
}
