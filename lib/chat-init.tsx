import React, { useEffect } from "react";
import {
  useLiveDirectMessagesListener,
  useLivePublicMessagesListener,
} from "./live-listeners";
import {
  useCreatedChannelsQuery,
  useDirectContactsQuery,
  useJoinedChannelsQuery,
} from "./queries";
import { useKeysQuery, useNostrGetUserProfileQuery } from "./nostr";

export function ChatInit() {
  const { publicKey } = useKeysQuery();
  const directContactsQuery = useDirectContactsQuery();
  const currentUserProfileQuery = useNostrGetUserProfileQuery(publicKey);
  const joinedChannelsQuery = useJoinedChannelsQuery();
  const createdChannelsQuery = useCreatedChannelsQuery();

  // Initial fetching of manual queries based on public key
  useEffect(() => {
    init();
  }, [publicKey]);

  useLiveDirectMessagesListener();
  useLivePublicMessagesListener();

  const init = async () => {
    await directContactsQuery.refetch();
    await createdChannelsQuery.refetch();
    await currentUserProfileQuery.refetch();
    await joinedChannelsQuery.refetch();
  };

  return <></>;
}
