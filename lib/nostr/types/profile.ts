import { Metadata } from "./metadata";

export type Profile = {
  id: string;
  creator: string;
  created: number;
  channelsLastSeenDate: Record<string, Date>;
} & Metadata;
