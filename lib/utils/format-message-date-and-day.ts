import { formatMessageDate } from "./format-message-time";
import { DirectMessage, PublicMessage } from "../nostr";

export const formatMessageDateAndDay = (
  msg: DirectMessage | PublicMessage,
  i: number,
  messagesList: DirectMessage[] | PublicMessage[]
) => {
  const prevMsg = messagesList[i - 1];
  const msgDate = formatMessageDate(msg.created);
  const prevMsgDate = prevMsg ? formatMessageDate(prevMsg.created) : null;
  if (msgDate !== prevMsgDate) {
    return msgDate;
  }
  return null;
};
