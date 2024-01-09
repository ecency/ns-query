import usePrevious from "react-use/lib/usePrevious";
import { useQueryClient } from "@tanstack/react-query";
import { ChatQueries } from "../queries";
import { useContext, useEffect } from "react";
import { NostrQueries, useKeysQuery } from "../nostr";
import { ChatContext } from "../chat-context-provider";

export function useActiveUserSwitching() {
  const queryClient = useQueryClient();
  const { activeUsername } = useContext(ChatContext);
  const previousActiveUser = usePrevious(activeUsername);

  const { publicKey } = useKeysQuery();
  const previousPublicKey = usePrevious(publicKey);

  useEffect(() => {
    if (
      activeUsername !== previousActiveUser ||
      previousPublicKey !== publicKey
    ) {
      queryClient.invalidateQueries([NostrQueries.PUBLIC_MESSAGES]);
      queryClient.invalidateQueries([NostrQueries.DIRECT_MESSAGES]);
      queryClient.invalidateQueries([ChatQueries.MESSAGES]);
      queryClient.invalidateQueries([
        ChatQueries.LEFT_CHANNELS,
        activeUsername,
      ]);
      queryClient.invalidateQueries([
        ChatQueries.DIRECT_CONTACTS,
        activeUsername,
      ]);
      queryClient.invalidateQueries([
        ChatQueries.JOINED_CHANNELS,
        activeUsername,
      ]);
    }
  }, [activeUsername, previousActiveUser, publicKey]);
}
