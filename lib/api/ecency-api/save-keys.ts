import { useMutation } from "@tanstack/react-query";
import { useContext } from "react";
import { ChatContext } from "../../chat-context-provider";
import axios from "axios";

export function useSaveKeys() {
  const { privateApiHost, ecencyAccessToken } = useContext(ChatContext);

  return useMutation({
    mutationKey: ["private-api", "save-keys"],
    mutationFn: async (data: {
      key: string;
      pubkey: string;
      iv: string;
      meta: any;
    }) =>
      axios
        .post<{ chat_keys: { key: string; pubkey: string; iv: string }[] }>(
          `${privateApiHost}/private-api/chats-add`,
          {
            ...data,
            code: ecencyAccessToken,
          },
        )
        .then((resp) => resp.data.chat_keys),
  });
}
