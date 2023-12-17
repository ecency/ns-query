import { NostrQueries } from "./queries";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// This query fills by useLiveDirectMessagesListener
export function useDirectMessagesQuery() {
  const queryClient = useQueryClient();

  return useQuery([NostrQueries.DIRECT_MESSAGES], {
    queryFn: () => queryClient.getQueryData([NostrQueries.DIRECT_MESSAGES]),
  });
}
