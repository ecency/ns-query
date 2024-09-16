import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ChatContext } from "../../chat-context-provider";

export function useGetKeysQuery() {
  const { privateApiHost, ecencyAccessToken } = useContext(ChatContext);

  return useQuery({
    queryKey: ["private-api", "get-keys", ecencyAccessToken],
    queryFn: () =>
      axios
        .post<{ key: string; pubkey: string; iv: string }[]>(
          `${privateApiHost}/private-api/chats`,
          {
            code: ecencyAccessToken,
          },
        )
        .then((resp) => resp.data[0]),
    enabled: !!ecencyAccessToken,
    refetchOnMount: true,
    staleTime: Infinity,
  });
}
