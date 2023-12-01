import { useQueries } from "@tanstack/react-query";
import {
  EncryptionTools,
  getUserChatPrivateKey,
  getUserChatPublicKey,
} from "../../utils";
import { useContext, useMemo } from "react";
import { NostrQueries } from "../queries";
import { NostrContext } from "../nostr-context";

export function useKeysQuery() {
  const { activeUsername, activeUserData } = useContext(NostrContext);

  const [{ data: publicKey }, { data: privateKey }, { data: iv }] = useQueries({
    queries: [
      {
        queryKey: [NostrQueries.PUBLIC_KEY, activeUsername],
        queryFn: async () => getUserChatPublicKey(activeUserData!!),
        enabled: !!activeUserData,
        initialData: null,
      },
      {
        queryKey: [NostrQueries.PRIVATE_KEY, activeUsername],
        queryFn: async () => {
          const pin = localStorage.getItem("ecency_nostr_pr_" + activeUsername);

          if (!pin) {
            return null;
          }

          const { key, iv } = getUserChatPrivateKey(activeUserData!!);
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
        enabled: !!activeUserData,
        initialData: null,
      },
      {
        queryKey: [NostrQueries.ACCOUNT_IV, activeUsername],
        queryFn: async () => getUserChatPrivateKey(activeUserData!!).iv,
        enabled: !!activeUserData,
        initialData: null,
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
