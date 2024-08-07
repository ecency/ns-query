import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ChatContext } from "../../chat-context-provider";

export function useGetKeysQuery() {
  const { privateApiHost, activeUsername, ecencyAccessToken } =
    useContext(ChatContext);

  return useQuery({
    queryKey: ["private-api", "get-keys", activeUsername],
    queryFn: () =>
      axios
        .post<{ key: string; pubkey: string; iv: string }[]>(
          `${privateApiHost}/private-api/chats`,
          {
            code: ecencyAccessToken,
          },
        )
        .then((resp) => resp.data[0]),
    enabled: !!activeUsername,
    refetchOnMount: false,
  });
}
