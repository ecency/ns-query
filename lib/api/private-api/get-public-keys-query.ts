import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ChatContext } from "../../chat-context-provider";

export function useGetPublicKeysQuery(username?: string) {
  const { privateApiHost } = useContext(ChatContext);

  return useQuery(
    ["private-api", "get-keys", username],
    () =>
      axios
        .get<{ pubkey: string }>(
          `${privateApiHost}/private-api/chats-pub/${username}`,
        )
        .then((resp) => resp.data),
    {
      enabled: !!username,
      refetchOnMount: false,
    },
  );
}
