import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNoStrAccount, EncryptionTools } from "../utils";
import { NostrQueries, useNostrPublishMutation } from "../nostr";
import { useContext } from "react";
import { Kind } from "nostr-tools";
import { UploadKeys, UploadKeysPayload } from "../types";
import { ChatContext } from "../chat-context-provider";

const crypto = require("crypto");

/**
 * Custom React hook for joining a chat with some side effects.
 *
 * This hook manages the process of joining a chat, resetting chat state, and uploading
 * a public key for secure communication.
 *
 * @param uploadChatKeys – Special function for uploading generated keys to user
 * @param onSuccess - A callback function to be called upon successful completion of chat join.
 *
 * @returns A function from the `useMutation` hook, which can be used to initiate the chat join process.
 */
export function useJoinChat(
  uploadChatKeys: UploadKeys,
  onSuccess?: () => void,
) {
  const queryClient = useQueryClient();
  const { activeUsername, activeUserData } = useContext(ChatContext);

  const { mutateAsync: uploadKeys } = useMutation(
    ["chats/upload-public-key"],
    async (keys: UploadKeysPayload) => uploadChatKeys(activeUserData!!, keys),
  );
  const { mutateAsync: updateProfile } = useNostrPublishMutation(
    ["chats/update-nostr-profile"],
    Kind.Metadata,
    () => {},
  );

  return useMutation(
    ["chat-join-chat"],
    async (pin: string) => {
      const keys = createNoStrAccount();
      localStorage.setItem("ecency_nostr_pr_" + activeUsername, pin);

      const initialVector = crypto.randomBytes(16);
      const encryptedKey = EncryptionTools.encrypt(
        keys.priv,
        pin,
        initialVector,
      );
      await uploadKeys({
        pub: keys.pub,
        priv: encryptedKey,
        iv: initialVector,
      });

      queryClient.setQueryData(
        [NostrQueries.PUBLIC_KEY, activeUsername],
        keys.pub,
      );
      queryClient.setQueryData(
        [NostrQueries.PRIVATE_KEY, activeUsername],
        keys.priv,
      );

      await updateProfile({
        tags: [["p", keys.pub]],
        eventMetadata: {
          name: activeUsername!,
          about: "",
          picture: "",
          joinedChannels: [],
        },
      });
    },
    {
      onSuccess,
    },
  );
}
