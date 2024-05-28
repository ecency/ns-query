import {useQuery} from "@tanstack/react-query";
import axios from "axios";
import {useContext} from "react";
import {ChatContext} from "../../chat-context-provider";

export function useGetPublicKeysQuery(username?: string) {
  const { privateApiHost } = useContext(ChatContext);

  return useQuery({
    queryKey: ["private-api", "get-pub-keys", username],
    queryFn: () =>
      axios
        .get<{
          pubkey: string;
        }>(`${privateApiHost}/private-api/chats-pub/${username}`)
        .then((resp) => resp.data),
    enabled: !!username,
    refetchOnMount: false,
  });
}

export function useGetSetOfPublicKeysQuery(usernames: string[] = []) {
  const { privateApiHost } = useContext(ChatContext);

  return useQuery({
    queryKey: ["private-api", "get-pub-keys", usernames],
    queryFn: async () => {
      const response = await axios.post<{ pubkey: string; username: string }[]>(
        `${privateApiHost}/private-api/chats-get`,
        {
          users: usernames,
        },
      );
      return response.data;
    },
    enabled: usernames.length > 0,
    refetchOnMount: false,
    initialData: [],
  });
}
