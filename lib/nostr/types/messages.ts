interface BaseMessage {
  id: string;
  content: string;
  creator: string;
  created: number;
  forwardedFrom?: string;
  parentMessageId?: string;
}

export interface PublicMessage extends BaseMessage {
  root: string;
  mentions: string[];
  sent?: number;
  parentMessage?: PublicMessage;
}

export interface DirectMessage extends BaseMessage {
  root?: string;
  peer: string;
  decrypted: boolean;
  sent?: number;
  parentMessage?: DirectMessage;
}

export type Message = PublicMessage | DirectMessage;
