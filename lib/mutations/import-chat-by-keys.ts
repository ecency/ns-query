import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EncryptionTools } from "../utils";
import { NostrQueries, useNostrPublishMutation } from "../nostr";
import { useContext } from "react";
import { Kind } from "nostr-tools";
import { UploadKeys } from "../types";
import { ChatContext } from "../chat-context-provider";
import { useSaveKeys } from "../api";

interface Payload {
  ecencyChatKey: string;
  pin: string;
}

export function useImportChatByKeys(
  onSuccess?: () => void,
  meta?: Record<string, unknown>,
) {
  const queryClient = useQueryClient();
  const { activeUsername, storage } = useContext(ChatContext);

  const { mutateAsync: uploadChatKeys } = useSaveKeys();
  const { mutateAsync: uploadKeys } = useMutation({
    mutationKey: ["chats/upload-public-key"],
    mutationFn: async (keys: Parameters<UploadKeys>[1]) =>
      uploadChatKeys({
        pubkey: keys.pub,
        iv: keys.iv.toString("base64"),
        key: keys.priv,
        meta: meta ?? {},
      }),
  });
  const { mutateAsync: updateProfile } = useNostrPublishMutation(
    ["chats/update-nostr-profile"],
    Kind.Metadata,
    () => {},
  );

  return useMutation({
    mutationKey: ["chats/import-chat-by-key"],
    mutationFn: async ({ ecencyChatKey, pin }: Payload) => {
      if (!activeUsername) {
        return;
      }
      let publicKey;
      let privateKey;
      let iv;

      try {
        const parsedObject = JSON.parse(
          Buffer.from(ecencyChatKey, "base64").toString(),
        );
        publicKey = parsedObject.pub;
        privateKey = parsedObject.priv;
        iv = parsedObject.iv;
      } catch (e) {
        throw new Error(
          "[Chat][Nostr] – no private, public keys or initial vector value in importing",
        );
      }

      if (!privateKey || !publicKey || !iv) {
        throw new Error(
          "[Chat][Nostr] – no private, public keys or initial vector value in importing",
        );
      }

      const initialVector = Buffer.from(iv, "base64");
      const encryptedKey = EncryptionTools.encrypt(
        privateKey,
        pin,
        initialVector,
      );

      await uploadKeys({
        pub: publicKey,
        priv: encryptedKey,
        iv: initialVector,
      });

      storage?.setItem("ecency_nostr_pr_" + activeUsername, pin);
      queryClient.setQueryData(
        [NostrQueries.PUBLIC_KEY, activeUsername],
        publicKey,
      );
      queryClient.setQueryData(
        [NostrQueries.PRIVATE_KEY, activeUsername],
        privateKey,
      );

      await updateProfile({
        tags: [["p", publicKey]],
        eventMetadata: {
          name: activeUsername!,
          about: "",
          picture: "",
        },
      });
    },
    onSuccess,
  });
}
