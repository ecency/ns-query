interface BaseCommunity {
  name: string;
  title: string;
  description: string;
  team: string[][];
}

export type KindOfCommunity<T extends BaseCommunity = BaseCommunity> = T;
