import { Event, Kind, nip04 } from "nostr-tools";
import { findTagValue } from "./find-tag-value";
import { filterTagValue } from "./filter-tag-value";
import { Channel, Message, Profile } from "../types";

export interface EventConverterResult {
  [Kind.ChannelCreation]: Channel;
  [Kind.EncryptedDirectMessage]: Promise<Message>;
  [Kind.ChannelMessage]: Message;
  [Kind.Metadata]: Profile;
  30078: string[];
}

export function convertEvent<KIND extends keyof EventConverterResult>(
  event: Event,
  publicKey?: string,
  privateKey?: string,
): EventConverterResult[KIND] | null {
  let content: any = {};
  try {
    content = JSON.parse(event.content);
  } catch (e) {
    content = null;
  }

  switch (event.kind as any) {
    case Kind.ChannelCreation:
      if (!content) {
        console.error(
          new Error("[Chat][Nostr] – message content is not a JSON"),
        );
        return null;
      }
      return {
        id: event.id,
        creator: event.pubkey,
        created: event.created_at,
        communityName: content.communityName,
        name: content.name,
        about: content.about,
        picture: content.picture,
      } as any;
    case Kind.EncryptedDirectMessage:
      return new Promise<Message>(async (resolve) => {
        const receiver = findTagValue(event, "p")!!;
        const peer = receiver === publicKey ? event.pubkey : receiver;
        const forwardedFrom = event.tags.find(([t]) => t === "fwd")?.[1];
        const parentMessageId = event.tags.find(([t]) => t === "pm")?.[1];

        const encryptedMessage = {
          id: event.id,
          root: filterTagValue(event, "e").find(
            (tag) => tag[3] === "root",
          )?.[1],
          peer,
          creator: event.pubkey,
          created: event.created_at,
          decrypted: false,
          sent: 1,
          forwardedFrom,
          parentMessageId,
        };

        if (!privateKey) {
          throw new Error(
            "[Chat][Nostr] – private key is not provided while message is encrypting",
          );
        }

        let decryptedMessageContent = event.content;
        try {
          decryptedMessageContent = await nip04.decrypt(
            privateKey,
            peer,
            event.content,
          );
        } catch (e) {}
        resolve({
          ...encryptedMessage,
          content: decryptedMessageContent,
          decrypted: true,
        });
      }) as any;
    case Kind.ChannelMessage:
      const eTags = filterTagValue(event, "e");
      const root = eTags.find((x) => x[3] === "root")?.[1];
      const mentions = filterTagValue(event, "p")
        .map((mention) => mention?.[1])
        .filter((mention) => !!mention);
      const forwardedFrom = event.tags.find(([t]) => t === "fwd")?.[1];
      if (!root) return null;
      return event.content
        ? {
            id: event.id,
            root,
            content: event.content,
            creator: event.pubkey,
            mentions,
            forwardedFrom,
            created: event.created_at,
            sent: 1,
          }
        : (null as any);
    case Kind.Metadata:
      if (!content) {
        return null;
      }

      return {
        id: event.id,
        creator: event.pubkey,
        created: event.created_at,
        name: content.name || "",
        about: content.about || "",
        picture: content.picture || "",
        joinedChannels: content.joinedChannels ?? [],
        channelsLastSeenDate: filterTagValue(event, "lastSeenDate").reduce(
          (acc, [_, channelId, lastSeenTime]) => ({
            ...acc,
            [channelId]: lastSeenTime ? new Date(+lastSeenTime) : undefined,
          }),
          {},
        ),
      } as any;
    case "30078":
      return content;
    default:
      return content;
  }
}
