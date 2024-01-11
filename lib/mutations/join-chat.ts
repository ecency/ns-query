import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNoStrAccount, EncryptionTools } from "../utils";
import { NostrQueries, useNostrPublishMutation } from "../nostr";
import { useContext } from "react";
import { Kind } from "nostr-tools";
import { ChatContext } from "../chat-context-provider";
import { useSaveKeys } from "../api";

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
export function useJoinChat(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { activeUsername } = useContext(ChatContext);

  const { mutateAsync: updateProfile } = useNostrPublishMutation(
    ["chats/update-nostr-profile"],
    Kind.Metadata,
    () => {},
  );
  const { mutateAsync: uploadKeys } = useSaveKeys();

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
        pubkey: keys.pub,
        key: encryptedKey,
        iv: initialVector.toString("base64"),
        meta: "",
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
