import { generatePrivateKey, getPublicKey } from "nostr-tools";

export const createNoStrAccount = () => {
  const priv = generatePrivateKey();
  const pub = getPublicKey(priv);
  return { pub, priv };
};
