import { useQuery } from "@tanstack/react-query";
import { ChatQueries } from "./queries";
import { CommunityModerator, useKeysQuery } from "../nostr";
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
export function useNostrJoinedCommunityTeamQuery(community: KindOfCommunity) {
  const { activeUsername } = useContext(ChatContext);

  const { hasKeys } = useKeysQuery();

  return useQuery(
    [ChatQueries.COMMUNITY_ROLES, community.name],
    async () => {
      let communityTeam: CommunityModerator[] = [];

      communityTeam.push({
        name: activeUsername!!,
        role: "owner",
      });

      for (const [name, role] of community.team) {
        if ([ROLES.ADMIN, ROLES.MOD].includes(role as ROLES)) {
          communityTeam.push({
            name,
            role,
          });
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
