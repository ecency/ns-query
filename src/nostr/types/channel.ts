import { Metadata } from "./metadata";

export type Channel = {
  id: string;
  creator: string;
  created: number;
} & Metadata;
