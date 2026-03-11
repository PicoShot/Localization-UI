export interface SessionPermissions {
  languagePermissions: Record<string, "read" | "write"> | "all";
}

export interface SessionUser {
  id: string;
  name: string;
  color: string;
  selectedKey: string | null;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export type WsMessage =
  | {
      type: "create_session";
      name: string;
      permissions: SessionPermissions;
      keys: SerializedKey[];
      locales: SerializedLocale[];
    }
  | { type: "join_session"; code: string; name: string }
  | { type: "session_created"; code: string; user: SessionUser }
  | {
      type: "session_joined";
      code: string;
      user: SessionUser;
      users: SessionUser[];
      permissions: SessionPermissions;
      keys: SerializedKey[];
      locales: SerializedLocale[];
    }
  | { type: "user_joined"; user: SessionUser }
  | { type: "user_left"; userId: string }
  | {
      type: "sync_state";
      keys: SerializedKey[];
      locales: SerializedLocale[];
      users: SessionUser[];
      permissions: SessionPermissions;
    }
  | {
      type: "edit_string_value";
      keyName: string;
      langCode: string;
      value: string;
      userId: string;
    }
  | {
      type: "edit_array_element";
      keyName: string;
      langCode: string;
      index: number;
      value: string;
      userId: string;
    }
  | { type: "add_array_element"; keyName: string; userId: string }
  | {
      type: "remove_array_element";
      keyName: string;
      index: number;
      userId: string;
    }
  | { type: "rename_key"; oldName: string; newName: string; userId: string }
  | { type: "delete_key"; keyName: string; userId: string }
  | { type: "add_key"; key: SerializedKey; userId: string }
  | {
      type: "move_key";
      sourceKeyName: string;
      targetKeyName: string;
      userId: string;
    }
  | { type: "select_key"; keyName: string | null; userId: string }
  | { type: "chat"; message: ChatMessage }
  | { type: "follow_user"; targetUserId: string }
  | { type: "bring_here"; targetUserId: string; keyName: string }
  | { type: "brought_here"; keyName: string; byUserName: string }
  | { type: "kick_user"; targetUserId: string }
  | { type: "kicked" }
  | { type: "update_permissions"; permissions: SessionPermissions }
  | { type: "permissions_changed"; permissions: SessionPermissions }
  | { type: "error"; message: string };

export interface SerializedKey {
  name: string;
  type: "string" | "array";
  values: Record<string, string | string[] | null | undefined>;
}

export interface SerializedLocale {
  version: number;
  languageCode: string;
  translations: Record<string, string | string[] | null | undefined>;
}

export function canWriteLanguage(
  permissions: SessionPermissions,
  langCode: string,
): boolean {
  if (permissions.languagePermissions === "all") return true;
  return permissions.languagePermissions[langCode] === "write";
}

export function canAccessLanguage(
  permissions: SessionPermissions,
  langCode: string,
): boolean {
  if (permissions.languagePermissions === "all") return true;
  return langCode in permissions.languagePermissions;
}
