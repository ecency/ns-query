import { DirectContact } from "../nostr";

export namespace ContactsTagsBuilder {
  export function buildContactsTags(
    directContacts: DirectContact[] | undefined,
  ) {
    return (directContacts ?? []).map((c) => buildContactTag(c));
  }

  export function buildLastSeenTags(
    directContacts: DirectContact[] | undefined,
    exclude?: DirectContact,
  ) {
    return (directContacts ?? [])
      .filter((c) => (exclude ? exclude.pubkey !== c.pubkey : true))
      .map((c) => buildLastSeenTag(c));
  }

  export function buildPinTags(
    directContacts: DirectContact[],
    exclude?: DirectContact,
  ) {
    return directContacts
      .filter((c) => (exclude ? exclude.pubkey !== c.pubkey : true))
      .map((c) => buildPinTag(c));
  }

  export function buildPinTag(contact: DirectContact) {
    return ["pinned", contact.pubkey, contact.pinned ? "true" : "false"];
  }

  export function buildContactTag(contact: DirectContact) {
    return ["p", contact.pubkey, "", contact.name];
  }

  export function buildLastSeenTag(contact: DirectContact) {
    return [
      "lastSeenDate",
      contact.pubkey,
      contact.lastSeenDate?.getTime().toString() ?? "",
    ];
  }
}
