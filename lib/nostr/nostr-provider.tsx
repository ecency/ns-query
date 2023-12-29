import React, { PropsWithChildren, useMemo, useRef } from "react";
import { SimplePool } from "nostr-tools";
import { NostrContext } from "./nostr-context";

export const RELAYS: Record<string, { read: true; write: true }> = {
    "wss://none.ecency.com": {read: true, write: true},
    "wss://ntwo.ecency.com": {read: true, write: true},
  "wss://relay.lacosanostr.com": { read: true, write: true },
  "wss://nostrue.com": { read: true, write: true },
  "wss://relay.damus.io": { read: true, write: true },
  "wss://nostr.libreleaf.com": { read: true, write: true },
  "wss://nos.lol": { read: true, write: true },
};

export function NostrProvider({ children }: PropsWithChildren<unknown>) {
  const poolRef = useRef(new SimplePool());
  const lowLatencyPoolRef = useRef(new SimplePool({ eoseSubTimeout: 10000 }));
  const useLowLatency = false;

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
      }}
    >
      {children}
    </NostrContext.Provider>
  );
}
