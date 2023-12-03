import { useQuery } from "@tanstack/react-query";
import { ChatQueries } from "./queries";
import { getUserChatPublicKey } from "../utils";
import { AccountData, CommunityModerator, useKeysQuery } from "../nostr";
import { useContext } from "react";
import { KindOfCommunity } from "../types";
import { ChatContext } from "../chat-context-provider";

export enum ROLES {
  OWNER = "owner",
  ADMIN = "admin",
  MOD = "mod",
  MEMBER = "member",
  GUEST = "guest",
  MUTED = "muted",
}

/**
 * Get a community team members which joined to Nostr and available to create a chat
 */
export function useNostrJoinedCommunityTeamQuery(
  community: KindOfCommunity,
  communityAccountData: AccountData,
  communityTeamAccountsData: AccountData[] = [],
) {
  const { activeUsername, activeUserData } = useContext(ChatContext);

  const { hasKeys, publicKey } = useKeysQuery();

  return useQuery(
    [ChatQueries.COMMUNITY_ROLES, community.name],
    async () => {
      let communityTeam: CommunityModerator[] = [];

      communityTeam.push({
        name: activeUsername!!,
        pubkey: publicKey!!,
        role: "owner",
      });

      for (const [name, role] of community.team) {
        if ([ROLES.ADMIN, ROLES.MOD].includes(role as ROLES)) {
          const account = communityTeamAccountsData.find(
            (a) => a.name === name,
          );

          if (!account) {
            continue;
          }

          const chatsPubKey = getUserChatPublicKey(account);
          if (!!chatsPubKey) {
            communityTeam.push({
              name,
              pubkey: chatsPubKey,
              role,
            });
          }
        }
      }

      return communityTeam;
    },
    {
      initialData: [],
      enabled: hasKeys && activeUsername === community.name,
    },
  );
}
