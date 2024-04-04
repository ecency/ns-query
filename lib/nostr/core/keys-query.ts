import { useQueries } from "@tanstack/react-query";
import { EncryptionTools, useIsMounted } from "../../utils";
import { useContext, useMemo } from "react";
import { NostrQueries } from "../queries";
import { ChatContext } from "../../chat-context-provider";
import { useGetKeysQuery } from "../../api";

export function useKeysQuery() {
  const { activeUsername, activeUserData } = useContext(ChatContext);
  const getKeysQuery = useGetKeysQuery();
  const isMounted = useIsMounted();

  if (isMounted()){
    if (!getKeysQuery.isFetched) {
      getKeysQuery.refetch();
    }
  }

  const [{ data: publicKey }, { data: privateKey }, { data: iv }] = useQueries({
    queries: [
      {
        queryKey: [NostrQueries.PUBLIC_KEY, activeUsername],
        queryFn: async () => getKeysQuery.data!.pubkey,
        enabled: !!activeUserData && !!getKeysQuery.data,
      },
      {
        queryKey: [NostrQueries.PRIVATE_KEY, activeUsername],
        queryFn: async () => {
          const pin = localStorage.getItem("ecency_nostr_pr_" + activeUsername);

          if (!pin) {
            return null;
          }

          const { key, iv } = getKeysQuery.data!;
          if (key && pin && iv) {
            try {
              return EncryptionTools.decrypt(
                key,
                pin,
                Buffer.from(iv, "base64"),
              );
            } catch (e) {
              return null;
            }
          }

          return null;
        },
        enabled: !!activeUserData && !!activeUsername && !!getKeysQuery.data,
        initialData: null,
      },
      {
        queryKey: [NostrQueries.ACCOUNT_IV, activeUsername],
        queryFn: async () => getKeysQuery.data!.iv,
        enabled: !!activeUserData && !!getKeysQuery.data,
      },
    ],
  });

  const hasKeys = useMemo(
    () => !!publicKey && !!privateKey,
    [publicKey, privateKey],
  );

  return useMemo(
    () => ({
      publicKey,
      privateKey,
      hasKeys,
      iv,
    }),
    [publicKey, privateKey, hasKeys],
  );
}
