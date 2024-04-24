interface BaseMessage {
  id: string;
  content: string;
  creator: string;
  created: number;
  forwardedFrom?: string;
}

export interface PublicMessage extends BaseMessage {
  root: string;
  mentions: string[];
  sent?: number;
}

export interface DirectMessage extends BaseMessage {
  root?: string;
  peer: string;
  decrypted: boolean;
  sent?: number;
  parentMessage?: DirectMessage;
  parentMessageId?: string;
}

export type Message = PublicMessage | DirectMessage;
