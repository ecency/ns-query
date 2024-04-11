import React, {
  createContext,
  PropsWithChildren,
  useEffect,
  useState,
} from "react";
import { AccountData, NostrProvider, useKeysQuery } from "./nostr";
import { ChatInit } from "./chat-init";

interface Context {
  revealPrivateKey: boolean;
  receiverPubKey: string;
  hasUserJoinedChat: boolean;
  setRevealPrivateKey: (d: boolean) => void;
  setReceiverPubKey: (key: string) => void;
  activeUsername: string | undefined;
  activeUserData: AccountData | undefined;
  privateApiHost: string;
  ecencyAccessToken: string;
  storage?: Storage;
}

interface Props {
  activeUsername?: string;
  activeUserData?: AccountData;
  privateApiHost: string;
  ecencyAccessToken: string;
  storage?: Storage;
}

export const ChatContext = createContext<Context>({
  revealPrivateKey: false,
  receiverPubKey: "",
  hasUserJoinedChat: false,
  activeUsername: undefined,
  activeUserData: undefined,
  privateApiHost: "",
  ecencyAccessToken: "",
  setRevealPrivateKey: () => {},
  setReceiverPubKey: () => {},
});

export const ChatContextProvider = (props: PropsWithChildren<Props>) => {
  const [revealPrivateKey, setRevealPrivateKey] = useState(false);
  const [receiverPubKey, setReceiverPubKey] = useState("");

  const { hasKeys } = useKeysQuery();

  const [activeUsername, setActiveUsername] = useState<string>();
  const [activeUserData, setActiveUserData] = useState<AccountData>();
  const [ecencyAccessToken, setEcencyAccessToken] = useState(
    props.ecencyAccessToken,
  );
  const [privateApiHost, setPrivateApiHost] = useState(props.privateApiHost);
  const [storage, setStorage] = useState<Storage | undefined>(props.storage);

  useEffect(() => {
    setEcencyAccessToken(props.ecencyAccessToken);
  }, [props.ecencyAccessToken]);

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
        privateApiHost,
        ecencyAccessToken,
        storage,
      }}
    >
      <NostrProvider>
        <ChatInit />
        {props.children}
      </NostrProvider>
    </ChatContext.Provider>
  );
};
