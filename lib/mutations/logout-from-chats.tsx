import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatQueries } from "../queries";
import { useContext } from "react";
import { NostrQueries } from "../nostr";
import { ChatContext } from "../chat-context-provider";

export function useLogoutFromChats() {
  const queryClient = useQueryClient();
  const { activeUsername, storage } = useContext(ChatContext);

  return useMutation(["chats/logout-from-chats"], async () => {
    storage?.removeItem("ecency_nostr_pr_" + activeUsername);
    queryClient.setQueryData([NostrQueries.PUBLIC_KEY, activeUsername], "");
    queryClient.setQueryData([NostrQueries.PRIVATE_KEY, activeUsername], "");
    queryClient.setQueryData([ChatQueries.JOINED_CHANNELS, activeUsername], []);
    queryClient.setQueryData(
      [ChatQueries.ORIGINAL_JOINED_CHANNELS, activeUsername],
      [],
    );
    queryClient.setQueryData(
      [ChatQueries.ORIGINAL_DIRECT_CONTACTS, activeUsername],
      [],
    );
    queryClient.setQueryData([ChatQueries.DIRECT_CONTACTS, activeUsername], []);
  });
}
