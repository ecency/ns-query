import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ChatContext } from "../../chat-context-provider";

export function useGetKeysQuery() {
  const { privateApiHost, activeUsername, ecencyAccessToken } =
    useContext(ChatContext);

  return useQuery(
    ["private-api", "get-keys", activeUsername],
    () =>
      axios
        .post<{ key: string; pubkey: string; iv: string }[]>(
          `${privateApiHost}/private-api/chats`,
          {
            code: ecencyAccessToken,
          },
        )
        .then((resp) => resp.data[0]),
    {
      enabled: !!activeUsername,
      refetchOnMount: false,
    },
  );
}
