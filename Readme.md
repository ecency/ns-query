# Nostr protocol react-query based client SDK for Ecency
[![NPM](https://img.shields.io/npm/v/@ecency/ns-query.svg)](https://www.npmjs.com/package/@ecency/ns-query) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Overview
This repository contains react-query based SDK for Ececny vision and mobile projects
## Installation
``yarn add @ecency/ns-query``

``npm install @ecency/ns-query``
## Setup
1. Add `ChatContextProvider` to your `App.tsx` as root element
2. Pass there current user information via props `<ChatContextProvider activeUsername={} activeUserData={} />`
3. Use!

## Queries
### High-level queries
1. [Channels query](lib/queries/channels-query.ts) – use this query for fetching user joined and created channels
   
   _Requirements – current user and its credentials_  
2. [Community channel query](lib/queries/community-channel-query.ts) – use this query for fetching the community channel from its posting json metadata

   _Requirements – nothing_
3. [Direct contacts query](lib/queries/direct-contacts-query.ts) – use this query for fetching direct contacts of active user

    _Requirements – current user and its credentials_
4. [Left community channels query](lib/queries/left-community-channels-query.ts) – use this query for fetching community channels from where active user had been left

   _Requirements – current user and its credentials_
5. [Messages query](lib/queries/messages-query.ts) – use this query for fetching channel or contact messages based on their username

   _Requirements – current user and its credentials_
   
    _Note – this query are invalidating each N seconds periodically to keep messages fresh_
6. [Joined community team query](lib/queries/nostr-joined-community-team-query.ts) – use this query for fetching community team member which joined to chats and assigned to moderation team

    _Requirements – current user and its credentials_

### Low-level queries
Low-level queries builds the high-level queries above
1. [Direct messages query](lib/nostr/queries/direct-messages-query.ts) – fetches direct messages by given direct contacts
2. [Public messages query](lib/nostr/queries/public-messages-query.ts) – fetches public messages by given channels

    _Both of them builds [messages query](lib/queries/messages-query.ts) and shouldn't be used for messages management._
3. [Get user profile query](lib/nostr/queries/get-user-profile-query.ts) – fetching user metadata from Nostr by given public key

## Mutations
### High-level mutations
All mutations marked as _override channel metadata_ means that mutation could by run only by channel owner
1. [Add community channel](lib/mutations/add-community-channel.ts) – adds community channel to community list(only locally w/o saving in Nostr or Ecency)
2. [Add direct contact](lib/mutations/add-direct-contact.ts) – adding direct contact to contacts list
3. [Create community chat](lib/mutations/create-community-chat.ts) – creates community channel and make current user as owner
4. [Fetch previous messages](lib/mutations/fetch-previous-messages.ts) – fetches channel's previous messages and appends to [messages query](lib/queries/messages-query.ts)
5. [Hide messages in channel](lib/mutations/hide-message-in-channel.ts) – hides message in a channel by owner(it overrides community channel metadata)
6. [Import chats by keys](lib/mutations/import-chat-by-keys.ts) – imports existing chat account and saves encrypted chat keys to accounts posting metadata
7. [Join chat](lib/mutations/join-chat.ts) – creates chatting account and saves encrypted chat keys to account metadata
8. [Leave community channel](lib/mutations/leave-community-channel.ts) – leaves community channel
9. [Logout from chats](lib/mutations/logout-from-chats.tsx) – clears current active user chatting session
10. [Resend message](lib/mutations/resend-message.ts) – resends failed messages which already exists in queries with status `2`
11. [Restore chat by PIN](lib/mutations/restore-chat-by-pin.ts) – restores logged out account session by PIN
12. [Send message](lib/mutations/send-message.ts) – sends message to specific direct contact or channel
13. [Update channel's blocked users](lib/mutations/update-channel-blocked-users.ts) – updates channel's blocked users(overrides channel metadata)
14. [Update channel's moderator](lib/mutations/update-channel-moderator.ts) – add, remove or update channel's moderator
15. [Update community channel](lib/mutations/update-community-channel.ts) – updates community channel's information(overrides channel metadata)
### Low-level mutations
1. [Find healthy relay](lib/nostr/mutations/find-healthy-relay.ts) – finds healthy Nostr relay and return its host(uses by library itself – no need to re-use it)
2. [Send direct message](lib/nostr/mutations/send-direct-message.ts) – sends message to direct contact(uses in [Send message](lib/mutations/send-message.ts))
3. [Send public message](lib/nostr/queries/public-messages-query.ts) – sends message to channel(uses in [Send message](lib/mutations/send-message.ts))
4. [Update left channels](lib/nostr/mutations/update-left-channels.ts) – updates left channels list(uses in [add community channel](lib/mutations/add-community-channel.ts) and [Leave community channel](lib/mutations/leave-community-channel.ts))

## Misc
[useActiveUserSwitching](lib/hooks/use-active-user-switching.ts) – invalidates all Nostr queries each time when active user changes(no need to call, library use it itself).

[useAutoScrollInChatBox](lib/hooks/use-auto-scroll-in-chat-box.ts) – uses for auto-scrolling to the end of chatbox(available in Web only)