import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EncryptionTools, getUserChatPrivateKey } from "../utils";
import { NostrContext, useKeysQuery, useNostrPublishMutation } from "../nostr";
import { Kind } from "nostr-tools";
import { NostrQueries } from "../nostr/queries";
import { useContext } from "react";

export function useRestoreChatByPin() {
  const queryClient = useQueryClient();
  const { activeUserData, activeUsername } = useContext(NostrContext);

  const { mutateAsync: updateProfile } = useNostrPublishMutation(
    ["chats/update-nostr-profile"],
    Kind.Metadata,
    () => {},
  );
  const { publicKey } = useKeysQuery();

  return useMutation(["chats/restore-chat-by-pin"], async (pin: string) => {
    if (!pin || !publicKey || !activeUserData) {
      throw new Error(
        "[Chat][Nostr] – no pin, public key or account information",
      );
    }

    const { iv: initialVector, key: privateKey } = getUserChatPrivateKey(
      activeUserData!!,
    );

    if (!initialVector || !privateKey) {
      throw new Error("[Chat][Nostr] – no initial vector or private key");
    }

    const decryptedKey = EncryptionTools.decrypt(
      privateKey,
      pin,
      Buffer.from(initialVector, "base64"),
    );
    queryClient.setQueryData(
      [NostrQueries.PRIVATE_KEY, activeUsername],
      decryptedKey,
    );

    localStorage.setItem("ecency_nostr_pr_" + activeUsername, pin);

    await updateProfile({
      tags: [],
      eventMetadata: {
        name: activeUsername!,
        about: "",
        picture: "",
      },
    });
  });
}
