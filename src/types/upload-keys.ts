import { AccountData } from "../nostr";

export interface UploadKeysPayload {
  pub: string;
  priv: string;
  iv: Buffer;
}
export type UploadKeys = (
  username: AccountData,
  keys: UploadKeysPayload,
) => void;
