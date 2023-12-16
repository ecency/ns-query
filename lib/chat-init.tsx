import { useListenNewComingMessagesQuery } from "./queries";
import { useActiveUserSwitching } from "./hooks";
import React from "react";

export function ChatInit() {
  useListenNewComingMessagesQuery();
  useActiveUserSwitching();

  return <></>;
}
