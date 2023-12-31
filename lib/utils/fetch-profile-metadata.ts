import { AccountData } from "../nostr";

export const getProfileMetaData = (user: AccountData) => {
  const { posting_json_metadata } = user;
  if (posting_json_metadata) {
    return JSON.parse(posting_json_metadata!).profile;
  }
};
