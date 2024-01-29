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
      const result = [];
      try {
        for (const username of usernames) {
          const response = await axios.get<{ pubkey: string }>(
            `${privateApiHost}/private-api/chats-pub/${username}`,
          );
          const data = response.data;
          result.push(data.pubkey);
        }
      } catch (e) {
        if (result.length > 0) {
          throw new Error(
            "[ns-query][private-api] failed to fetch set of public keys",
          );
        }
      }
      return result;
    },
    {
      enabled: usernames.length > 0,
      refetchOnMount: false,
    },
  );
}
