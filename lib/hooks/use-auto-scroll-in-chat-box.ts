import { useLayoutEffect } from "react";
import { useMessagesQuery } from "../queries";
import { Channel, DirectContact } from "../nostr";

export function useAutoScrollInChatBox(
  currentContact?: DirectContact,
  currentChannel?: Channel,
) {
  const { data } = useMessagesQuery(currentContact, currentChannel);

  useLayoutEffect(() => {
    if (data.length > 0) {
      const first = data[data.length - 1];
      const messageElement = document.querySelector(
        `[data-message-id='${first.id}']`,
      );
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [data]);
}
