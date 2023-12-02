import { AccountData } from "../nostr";

export const getUserChatPrivateKey = (account: AccountData) => {
  if (account.posting_json_metadata) {
    const { posting_json_metadata } = account;
    const profile = JSON.parse(posting_json_metadata).profile;
    if (profile?.echat) {
      const {
        echat: { key, iv },
      } = profile || { echat: {} };
      return { key: key ?? null, iv: iv ?? null };
    }
  }
  return { key: null, iv: null };
};
