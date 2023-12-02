import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatQueries } from "../queries";
import { NostrQueries } from "../nostr/queries";
import { useContext } from "react";
import { NostrContext } from "../nostr";

export function useLogoutFromChats() {
  const queryClient = useQueryClient();
  const { activeUsername } = useContext(NostrContext);

  return useMutation(["chats/logout-from-chats"], async () => {
    localStorage.removeItem("ecency_nostr_pr_" + activeUsername);
    queryClient.setQueryData([NostrQueries.PUBLIC_KEY, activeUsername], "");
    queryClient.setQueryData([NostrQueries.PRIVATE_KEY, activeUsername], "");
    queryClient.setQueryData([ChatQueries.CHANNELS, activeUsername], []);
    queryClient.setQueryData([ChatQueries.DIRECT_CONTACTS, activeUsername], []);
  });
}
