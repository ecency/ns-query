import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ChatContext } from "../../chat-context-provider";

export function useGetPublicKeysQuery(username?: string) {
  const { privateApiHost } = useContext(ChatContext);

  return useQuery(
    ["private-api", "get-pub-keys", username],
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

export function useGetSetOfPublicKeysQuery(usernames: string[] = []) {
  const { privateApiHost } = useContext(ChatContext);

  return useQuery(
    ["private-api", "get-pub-keys", usernames],
    async () => {
      const response = await axios.post<{ pubkey: string; username: string }[]>(
        `${privateApiHost}/private-api/chats-get`,
        {
          users: usernames,
        },
      );
      return response.data;
    },
    {
      enabled: usernames.length > 0,
      refetchOnMount: false,
      initialData: [],
    },
  );
}
