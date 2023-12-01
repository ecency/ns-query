import React, { PropsWithChildren, useMemo, useRef, useState } from "react";
import { SimplePool } from "nostr-tools";
import { AccountData, NostrContext } from "./nostr-context";

export const RELAYS = {
  "wss://relay1.nostrchat.io": { read: true, write: true },
  "wss://relay2.nostrchat.io": { read: true, write: true },
  "wss://relay.damus.io": { read: true, write: true },
  "wss://relay.snort.social": { read: true, write: true },
  "wss://nos.lol": { read: true, write: true },
};

export function NostrProvider({ children }: PropsWithChildren) {
  const poolRef = useRef(new SimplePool());
  const lowLatencyPoolRef = useRef(new SimplePool({ eoseSubTimeout: 10000 }));
  const useLowLatency = false;

  const [activeUsername, setActiveUsername] = useState<string>();
  const [activeUserData, setActiveUserData] = useState<AccountData>();

  const readRelays = useMemo(
    () => Object.keys(RELAYS).filter((r) => RELAYS[r].read),
    [],
  );
  const writeRelays = useMemo(
    () => Object.keys(RELAYS).filter((r) => RELAYS[r].write),
    [],
  );

  return (
    <NostrContext.Provider
      value={{
        pool: useLowLatency ? lowLatencyPoolRef.current : poolRef.current,
        readRelays,
        writeRelays,
        activeUsername,
        activeUserData,
      }}
    >
      {children}
    </NostrContext.Provider>
  );
}
