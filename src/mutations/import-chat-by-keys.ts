import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EncryptionTools } from "../utils";
import { AccountData, NostrContext, useNostrPublishMutation } from "../nostr";
import { NostrQueries } from "../nostr/queries";
import { useContext } from "react";
import { Kind } from "nostr-tools";

interface Payload {
  ecencyChatKey: string;
  pin: string;
}

export function useImportChatByKeys(
  uploadChatKeys: (
    activeUserData: AccountData,
    keys: {
      pub: string;
      priv: string;
      iv: Buffer;
    },
  ) => Promise<void>,
  onSuccess?: () => void,
) {
  const queryClient = useQueryClient();
  const { activeUsername, activeUserData } = useContext(NostrContext);

  const { mutateAsync: uploadKeys } = useMutation(
    ["chats/upload-public-key"],
    (keys: Parameters<typeof uploadChatKeys>[1]) =>
      uploadChatKeys(activeUserData!!, keys),
  );
  const { mutateAsync: updateProfile } = useNostrPublishMutation(
    ["chats/update-nostr-profile"],
    Kind.Metadata,
    () => {},
  );

  return useMutation(
    ["chats/import-chat-by-key"],
    async ({ ecencyChatKey, pin }: Payload) => {
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

      localStorage.setItem("ecency_nostr_pr_" + activeUsername, pin);
      queryClient.setQueryData(
        [NostrQueries.PUBLIC_KEY, activeUsername],
        publicKey,
      );
      queryClient.setQueryData(
        [NostrQueries.PRIVATE_KEY, activeUsername],
        privateKey,
      );

      await updateProfile({
        tags: [],
        eventMetadata: {
          name: activeUsername!,
          about: "",
          picture: "",
        },
      });
    },
    {
      onSuccess,
    },
  );
}
