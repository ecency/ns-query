import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ChatContext } from "../../chat-context-provider";

interface GetPubKeysResponse {
  pubkey: string;
}

interface GetPubKeysOfUsersResponse {
  pubkey: string;
  username: string;
}

export function useGetPublicKeysQuery(username?: string) {
  const { privateApiHost } = useContext(ChatContext);

  return useQuery({
    queryKey: ["private-api", "get-pub-keys", username],
    queryFn: async () => {
      const response = await axios.get<GetPubKeysResponse>(
        `${privateApiHost}/private-api/chats-pub/${username}`,
      );
      return response.data;
    },
    enabled: !!username,
    refetchOnMount: true,
    staleTime: Infinity,
  });
}

export function useGetSetOfPublicKeysQuery(usernames: string[] = []) {
  const { privateApiHost } = useContext(ChatContext);

  return useQuery({
    queryKey: ["private-api", "get-pub-keys", usernames],
    queryFn: async () => {
      const response = await axios.post<GetPubKeysOfUsersResponse[]>(
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
