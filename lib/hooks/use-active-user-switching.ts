import usePrevious from "react-use/lib/usePrevious";
import { useQueryClient } from "@tanstack/react-query";
import { ChatQueries } from "../queries";
import { NostrQueries } from "../nostr/queries";
import { useContext, useEffect } from "react";
import { NostrContext } from "../nostr";

export function useActiveUserSwitching() {
  const { activeUsername } = useContext(NostrContext);
  const previousActiveUser = usePrevious(activeUsername);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (activeUsername !== previousActiveUser) {
      queryClient.setQueryData([NostrQueries.PUBLIC_MESSAGES], []);
      queryClient.setQueryData([NostrQueries.DIRECT_MESSAGES], []);
      queryClient.setQueryData([ChatQueries.LEFT_CHANNELS], []);

      queryClient.invalidateQueries([NostrQueries.PUBLIC_MESSAGES]);
      queryClient.invalidateQueries([NostrQueries.DIRECT_MESSAGES]);
      queryClient.invalidateQueries([ChatQueries.LEFT_CHANNELS]);
      queryClient.invalidateQueries([ChatQueries.MESSAGES]);
    }
  }, [activeUsername, previousActiveUser]);
}
