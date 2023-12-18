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
      queryClient.setQueryData([NostrQueries.PUBLIC_MESSAGES], { pages: [] });
      queryClient.setQueryData([NostrQueries.DIRECT_MESSAGES], { pages: [] });
      queryClient.setQueryData([ChatQueries.LEFT_CHANNELS], []);
      queryClient.setQueryData([ChatQueries.DIRECT_CONTACTS], []);

      queryClient.invalidateQueries([NostrQueries.PUBLIC_MESSAGES]);
      queryClient.invalidateQueries([NostrQueries.DIRECT_MESSAGES]);
      queryClient.invalidateQueries([ChatQueries.LEFT_CHANNELS]);
      queryClient.invalidateQueries([ChatQueries.MESSAGES]);
      queryClient.invalidateQueries([ChatQueries.DIRECT_CONTACTS]);
    }
  }, [activeUsername, previousActiveUser, publicKey]);
}
