import { useContext } from "react";
import { ChatContext } from "../../chat-context-provider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ChatQueries } from "../../queries";

export function useAddChannelToEcency() {
  const { privateApiHost, ecencyAccessToken } = useContext(ChatContext);
  const queryClient = useQueryClient();

  return useMutation(
    ["private-api", "add-community-channel"],
    async (data: { username: string; channel_id: string; meta: any }) => {
      await axios.post<unknown>(`${privateApiHost}/private-api/channel-add`, {
        ...data,
        code: ecencyAccessToken,
      });
      return data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ["private-api", "get-community-channel", data.username],
        });
        queryClient.invalidateQueries({
          queryKey: [ChatQueries.COMMUNITY_CHANNEL, data.username],
        });
      },
    },
  );
}
