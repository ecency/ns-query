import { useActiveUserSwitching } from "./hooks";
import React from "react";
import { useLiveDirectMessagesListener } from "./live-listeners";

export function ChatInit() {
  useActiveUserSwitching();
  useLiveDirectMessagesListener();

  return <></>;
}
