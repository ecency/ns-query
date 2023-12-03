import React, {
  createContext,
  PropsWithChildren,
  useEffect,
  useState,
} from "react";
import { AccountData, NostrProvider, useKeysQuery } from "./nostr";

interface Context {
  revealPrivateKey: boolean;
  receiverPubKey: string;
  hasUserJoinedChat: boolean;
  setRevealPrivateKey: (d: boolean) => void;
  setReceiverPubKey: (key: string) => void;
  activeUsername: string | undefined;
  activeUserData: AccountData | undefined;
}

interface Props {
  activeUsername?: string;
  activeUserData?: AccountData;
}

export const ChatContext = createContext<Context>({
  revealPrivateKey: false,
  receiverPubKey: "",
  hasUserJoinedChat: false,
  activeUsername: undefined,
  activeUserData: undefined,
  setRevealPrivateKey: () => {},
  setReceiverPubKey: () => {},
});

export const ChatContextProvider = (props: PropsWithChildren<Props>) => {
  const [revealPrivateKey, setRevealPrivateKey] = useState(false);
  const [receiverPubKey, setReceiverPubKey] = useState("");

  const { hasKeys } = useKeysQuery();

  const [activeUsername, setActiveUsername] = useState<string>();
  const [activeUserData, setActiveUserData] = useState<AccountData>();

  useEffect(() => {
    setActiveUsername(props.activeUsername);
  }, [props.activeUsername]);

  useEffect(() => {
    setActiveUserData(props.activeUserData);
  }, [props.activeUserData]);

  return (
    <ChatContext.Provider
      value={{
        revealPrivateKey,
        receiverPubKey,
        hasUserJoinedChat: hasKeys,
        setRevealPrivateKey,
        setReceiverPubKey,
        activeUsername,
        activeUserData,
      }}
    >
      <NostrProvider>{props.children}</NostrProvider>
    </ChatContext.Provider>
  );
};
