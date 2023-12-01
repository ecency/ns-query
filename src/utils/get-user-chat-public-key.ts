import { AccountData } from "../nostr";

export const getUserChatPublicKey = (account: AccountData): string | null => {
  if (account.posting_json_metadata) {
    const { posting_json_metadata } = account;
    const profile = JSON.parse(posting_json_metadata).profile;
    if (profile?.echat) {
      const {
        echat: { pubKey },
      } = profile || { echat: {} };
      return pubKey;
    }
  }
  return null;
};
