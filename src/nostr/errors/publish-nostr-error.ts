import { Event } from "nostr-tools";

export class PublishNostrError extends Error {
  public event: Event;

  constructor(message: string, event: Event) {
    super(message);
    this.event = event;
  }
}
