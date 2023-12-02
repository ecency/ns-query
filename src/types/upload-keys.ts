import { AccountData } from "../nostr";

export interface UploadKeysPayload {
  pub: string;
  priv: string;
  iv: string;
}
export type UploadKeys = (
  username: AccountData,
  keys: UploadKeysPayload,
) => void;
