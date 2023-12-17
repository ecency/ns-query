import { useActiveUserSwitching } from "./hooks";
import React from "react";
import {
  useLiveDirectMessagesListener,
  useLivePublicMessagesListener,
} from "./live-listeners";

export function ChatInit() {
  useActiveUserSwitching();
  useLiveDirectMessagesListener();
  useLivePublicMessagesListener();

  return <></>;
}
