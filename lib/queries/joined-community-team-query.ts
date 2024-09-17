import { useGetSetOfPublicKeysQuery } from "../api";
import { KindOfCommunity } from "../types";

export enum ROLES {
  OWNER = "owner",
  ADMIN = "admin",
  MOD = "mod",
}

export function useJoinedCommunityTeamQuery(
  community?: KindOfCommunity,
): ReturnType<typeof useGetSetOfPublicKeysQuery> {
  return useGetSetOfPublicKeysQuery(
    community?.team
      .filter(([_, role]) =>
        [ROLES.MOD, ROLES.ADMIN, ROLES.OWNER].includes(role as ROLES),
      )
      .map(([name]) => name),
  );
}
