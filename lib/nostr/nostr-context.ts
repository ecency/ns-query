import { createContext } from "react";
import { SimplePool } from "nostr-tools";

export interface AccountData {
  name: string;
  posting_json_metadata: string;
}

export const NostrContext = createContext<{
  pool: SimplePool | undefined;
  readRelays: string[];
  writeRelays: string[];
  sleepMode: boolean;
  setSleepMode: (v: boolean) => void;
}>({
  pool: undefined,
  writeRelays: [],
  readRelays: [],
  sleepMode: false,
  setSleepMode: () => {},
});
