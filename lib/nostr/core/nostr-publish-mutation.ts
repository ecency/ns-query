import {
  MutationKey,
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { useContext } from "react";
import { Event, getEventHash, Kind, signEvent } from "nostr-tools";
import { NostrContext } from "../nostr-context";
import { Metadata } from "../types";
import { PublishNostrError } from "../errors";
import { NostrQueries } from "../queries";
import { ChatContext } from "../../chat-context-provider";

type Payload = { eventMetadata: Metadata | string; tags: string[][] };

export function useNostrPublishMutation(
  key: MutationKey,
  kind: Kind | number,
  onBeforeSend: (event: Event) => void,
  options?: UseMutationOptions<Event, PublishNostrError | Error, Payload>,
) {
  const { activeUsername } = useContext(ChatContext);
  const { pool, writeRelays } = useContext(NostrContext);
  const queryClient = useQueryClient();

  const sign = async (event: Event) => ({
    ...event,
    id: getEventHash(event),
    sig: await signEvent(
      event,
      queryClient.getQueryData<string>([
        NostrQueries.PRIVATE_KEY,
        activeUsername,
      ])!!,
    ),
  });

  const waitUntilOneResolved = (promises: Promise<void>[]) =>
    new Promise<void>((resolve) => {
      if (promises.length === 0) {
        resolve();
        return;
      }
      for (const promise of promises) {
        promise.then(() => resolve());
      }
    });

  return useMutation(
    key,
    ({ eventMetadata, tags }: Payload) =>
      new Promise<Event>(async (resolve, reject) => {
        let signedEvent: Event | null;
        try {
          signedEvent = await sign({
            kind,
            id: "",
            sig: "",
            content:
              typeof eventMetadata === "object"
                ? JSON.stringify(eventMetadata)
                : eventMetadata,
            pubkey: queryClient.getQueryData<string>([
              NostrQueries.PUBLIC_KEY,
              activeUsername,
            ])!!,
            created_at: Math.floor(Date.now() / 1000),
            tags,
          });
        } catch (e) {
          console.error(e);
          signedEvent = null;
        }
        if (!signedEvent) {
          reject(
            new Error("[Chat][Nostr] – event couldn't be signed(kind: " + kind),
          );
          return;
        }

        onBeforeSend(signedEvent);

        try {
          await waitUntilOneResolved(
            pool?.publish(writeRelays, signedEvent) ?? [],
          );
          resolve(signedEvent);
        } catch (e) {
          throw new PublishNostrError(
            "[Chat][Nostr] – failed to publish event (kind: " +
              signedEvent!!.kind,
            signedEvent!!,
          );
        }
        // publishInfo?.on("ok", () => resolve(signedEvent!!));
        // publishInfo?.on("failed", () =>
        //   reject(
        //     new PublishNostrError(
        //       "[Chat][Nostr] – failed to publish event (kind: " +
        //         signedEvent!!.kind,
        //       signedEvent!!,
        //     ),
        //   ),
        // );
      }),
    options,
  );
}
