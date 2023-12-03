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
}>({
  pool: undefined,
  writeRelays: [],
  readRelays: [],
});
