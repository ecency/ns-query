interface BaseMessage {
  id: string;
  content: string;
  creator: string;
  created: number;
  forwardedFrom?: string;
}

export interface PublicMessage extends BaseMessage {
  root: string;
  children?: PublicMessage[];
  mentions: string[];
  sent?: number;
}

export interface DirectMessage extends BaseMessage {
  root?: string;
  peer: string;
  children?: DirectMessage[];
  decrypted: boolean;
  sent?: number;
}

export type Message = PublicMessage | DirectMessage;
