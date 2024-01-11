import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EncryptionTools } from "../utils";
import { NostrQueries, useKeysQuery, useNostrPublishMutation } from "../nostr";
import { Kind } from "nostr-tools";
import { useContext } from "react";
import { ChatContext } from "../chat-context-provider";
import { useGetKeysQuery, useSaveKeys } from "../api";

export function useRestoreChatByPin() {
  const queryClient = useQueryClient();
  const { activeUserData, activeUsername } = useContext(ChatContext);

  const { publicKey } = useKeysQuery();
  const { data: keys } = useGetKeysQuery();

  const { mutateAsync: updateProfile } = useNostrPublishMutation(
    ["chats/update-nostr-profile"],
    Kind.Metadata,
    () => {},
  );
  const { mutateAsync: uploadKeys } = useSaveKeys();

  return useMutation(["chats/restore-chat-by-pin"], async (pin: string) => {
    if (!pin || !publicKey || !activeUserData) {
      throw new Error(
        "[Chat][Nostr] – no pin, public key or account information",
      );
    }

    const { iv: initialVector, key: privateKey } = keys ?? {};

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
