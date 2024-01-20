import React, { useEffect } from "react";
import {
  useContactsInitialization,
  useLiveDirectMessagesListener,
  useLivePublicMessagesListener,
} from "./live-listeners";
import {
  useCreatedChannelsQuery,
  useDirectContactsQuery,
  useJoinedChannelsQuery,
  useOriginalDirectContactsQuery,
  useOriginalJoinedChannelsQuery,
} from "./queries";
import { useKeysQuery, useNostrGetUserProfileQuery } from "./nostr";

export function ChatInit() {
  const { publicKey } = useKeysQuery();
  const directContactsQuery = useDirectContactsQuery();
  const originalDirectContactsQuery = useOriginalDirectContactsQuery();
  const currentUserProfileQuery = useNostrGetUserProfileQuery(publicKey);
  const joinedChannelsQuery = useJoinedChannelsQuery();
  const originalJoinedChannelsQuery = useOriginalJoinedChannelsQuery();
  const createdChannelsQuery = useCreatedChannelsQuery();

  // Initial fetching of manual queries based on public key
  useEffect(() => {
    if (publicKey) {
      init();
    }
  }, [publicKey]);

  useContactsInitialization();
  useLiveDirectMessagesListener();
  useLivePublicMessagesListener();

  const init = async () => {
    await originalDirectContactsQuery.refetch();
    await directContactsQuery.refetch();
    await originalJoinedChannelsQuery.refetch();
    await createdChannelsQuery.refetch();
    await currentUserProfileQuery.refetch();
    await joinedChannelsQuery.refetch();
  };

  return <></>;
}
