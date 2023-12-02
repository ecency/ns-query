import React, { createContext, useState } from "react";
import {
  NostrListenerQueriesProvider,
  NostrProvider,
  useKeysQuery,
} from "./nostr";
import { useActiveUserSwitching } from "./hooks";

interface Context {
  revealPrivateKey: boolean;
  receiverPubKey: string;
  hasUserJoinedChat: boolean;
  setRevealPrivateKey: (d: boolean) => void;
  setReceiverPubKey: (key: string) => void;
}

interface Props {
  children: JSX.Element | JSX.Element[];
}

export const ChatContext = createContext<Context>({
  revealPrivateKey: false,
  receiverPubKey: "",
  hasUserJoinedChat: false,
  setRevealPrivateKey: () => {},
  setReceiverPubKey: () => {},
});

export const ChatContextProvider = (props: Props) => {
  const [revealPrivateKey, setRevealPrivateKey] = useState(false);
  const [receiverPubKey, setReceiverPubKey] = useState("");

  const { hasKeys } = useKeysQuery();

  useActiveUserSwitching();

  return (
    <NostrListenerQueriesProvider>
      <ChatContext.Provider
        value={{
          revealPrivateKey,
          receiverPubKey,
          hasUserJoinedChat: hasKeys,
          setRevealPrivateKey,
          setReceiverPubKey,
        }}
      >
        <NostrProvider>{props.children}</NostrProvider>
      </ChatContext.Provider>
    </NostrListenerQueriesProvider>
  );
};
