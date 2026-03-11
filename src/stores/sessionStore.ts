import { create } from "zustand";
import WebSocket from "@tauri-apps/plugin-websocket";
import type {
  WsMessage,
  SessionPermissions,
  SessionUser,
  ChatMessage,
} from "@/lib/protocol";
import { useEditorStore } from "./editorStore";

interface SessionState {
  connected: boolean;
  connecting: boolean;
  sessionCode: string | null;
  isOwner: boolean;
  myId: string | null;
  myName: string;
  myColor: string;
  users: SessionUser[];
  permissions: SessionPermissions | null;
  chatMessages: ChatMessage[];
  followingUserId: string | null;
  error: string | null;

  createSession: (
    serverUrl: string,
    name: string,
    permissions: SessionPermissions,
  ) => Promise<void>;
  joinSession: (serverUrl: string, code: string, name: string) => Promise<void>;
  disconnect: () => void;
  sendSelectKey: (keyName: string | null) => void;
  sendEditStringValue: (
    keyName: string,
    langCode: string,
    value: string,
  ) => void;
  sendEditArrayElement: (
    keyName: string,
    langCode: string,
    index: number,
    value: string,
  ) => void;
  sendAddArrayElement: (keyName: string) => void;
  sendRemoveArrayElement: (keyName: string, index: number) => void;
  sendRenameKey: (oldName: string, newName: string) => void;
  sendDeleteKey: (keyName: string) => void;
  sendAddKey: (key: {
    name: string;
    type: "string" | "array";
    values: Record<string, string | string[] | null | undefined>;
  }) => void;
  sendMoveKey: (sourceKeyName: string, targetKeyName: string) => void;
  sendChat: (text: string) => void;
  followUser: (userId: string | null) => void;
  bringHere: (targetUserId: string) => void;
  kickUser: (targetUserId: string) => void;
  updatePermissions: (permissions: SessionPermissions) => void;
  clearError: () => void;
}

let wsInstance: WebSocket | null = null;

function send(msg: WsMessage) {
  if (wsInstance) {
    wsInstance.send(JSON.stringify(msg));
  }
}

function handleIncoming(
  msg: WsMessage,
  get: () => SessionState,
  set: (partial: Partial<SessionState>) => void,
) {
  const editor = useEditorStore.getState();

  switch (msg.type) {
    case "session_created": {
      set({
        connected: true,
        connecting: false,
        sessionCode: msg.code,
        isOwner: true,
        myId: msg.user.id,
        myColor: msg.user.color,
        users: [msg.user],
        error: null,
      });
      break;
    }

    case "session_joined": {
      set({
        connected: true,
        connecting: false,
        sessionCode: msg.code,
        isOwner: false,
        myId: msg.user.id,
        myColor: msg.user.color,
        users: msg.users,
        permissions: msg.permissions,
        error: null,
      });

      const locales = msg.locales.map((l) => ({
        version: l.version,
        languageCode: l.languageCode,
        translations: l.translations as Record<string, string | string[]>,
      }));
      editor.loadFiles(locales, new Map());
      for (const key of msg.keys) {
        const existing = useEditorStore
          .getState()
          .keys.find((k) => k.name === key.name);
        if (!existing) {
          editor.addKey(key);
        }
      }
      break;
    }

    case "user_joined": {
      set({ users: [...get().users, msg.user] });
      break;
    }

    case "user_left": {
      set({ users: get().users.filter((u) => u.id !== msg.userId) });
      if (get().followingUserId === msg.userId) {
        set({ followingUserId: null });
      }
      break;
    }

    case "edit_string_value": {
      editor.setStringValue(msg.keyName, msg.langCode, msg.value);
      break;
    }

    case "edit_array_element": {
      editor.setArrayElement(msg.keyName, msg.langCode, msg.index, msg.value);
      break;
    }

    case "add_array_element": {
      editor.addArrayElement(msg.keyName);
      break;
    }

    case "remove_array_element": {
      editor.removeArrayElement(msg.keyName, msg.index);
      break;
    }

    case "rename_key": {
      editor.renameKey(msg.oldName, msg.newName);
      break;
    }

    case "delete_key": {
      const currentSelected = useEditorStore.getState().selectedKeyName;
      if (currentSelected === msg.keyName) {
        editor.setSelectedKeyName(null);
      }
      const keys = useEditorStore
        .getState()
        .keys.filter((k) => k.name !== msg.keyName);
      useEditorStore.setState({ keys, hasUnsavedChanges: true });
      break;
    }

    case "add_key": {
      editor.addKey(msg.key);
      break;
    }

    case "move_key": {
      editor.moveKey(msg.sourceKeyName, msg.targetKeyName);
      break;
    }

    case "select_key": {
      set({
        users: get().users.map((u) =>
          u.id === msg.userId ? { ...u, selectedKey: msg.keyName } : u,
        ),
      });
      if (get().followingUserId === msg.userId && msg.keyName) {
        editor.setSelectedKeyName(msg.keyName);
      }
      break;
    }

    case "chat": {
      set({ chatMessages: [...get().chatMessages, msg.message] });
      break;
    }

    case "brought_here": {
      editor.setSelectedKeyName(msg.keyName);
      break;
    }

    case "kicked": {
      const wasConnected = get().connected;
      if (wsInstance) {
        wsInstance.disconnect();
        wsInstance = null;
      }
      set({
        connected: false,
        connecting: false,
        sessionCode: null,
        isOwner: false,
        myId: null,
        users: [],
        permissions: null,
        chatMessages: [],
        followingUserId: null,
        error: wasConnected ? "You were kicked from the session" : null,
      });
      break;
    }

    case "permissions_changed": {
      set({ permissions: msg.permissions });
      break;
    }

    case "error": {
      set({ error: msg.message, connecting: false });
      break;
    }
  }
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  connected: false,
  connecting: false,
  sessionCode: null,
  isOwner: false,
  myId: null,
  myName: "",
  myColor: "",
  users: [],
  permissions: null,
  chatMessages: [],
  followingUserId: null,
  error: null,

  createSession: async (serverUrl, name, permissions) => {
    if (wsInstance) {
      get().disconnect();
    }

    set({ connecting: true, error: null, myName: name, permissions });

    try {
      wsInstance = await WebSocket.connect(serverUrl);

      wsInstance.addListener((rawMsg) => {
        if (rawMsg.type === "Text") {
          try {
            const parsed: WsMessage = JSON.parse(rawMsg.data);
            handleIncoming(parsed, get, set);
          } catch (e) {
            console.error(e);
          }
        }
        if (rawMsg.type === "Close") {
          const state = get();
          if (state.connected) {
            set({
              connected: false,
              connecting: false,
              sessionCode: null,
              isOwner: false,
              myId: null,
              users: [],
              permissions: null,
              chatMessages: [],
              followingUserId: null,
            });
            wsInstance = null;
          }
        }
      });

      const editor = useEditorStore.getState();
      const keys = editor.keys.map((k) => ({
        name: k.name,
        type: k.type,
        values: k.values,
      }));
      const locales = editor.locales.map((l) => ({
        version: l.version,
        languageCode: l.languageCode,
        translations: l.translations,
      }));

      send({
        type: "create_session",
        name,
        permissions,
        keys,
        locales,
      });
    } catch (e) {
      set({ connecting: false, error: `Connection failed: ${e}` });
    }
  },

  joinSession: async (serverUrl, code, name) => {
    if (wsInstance) {
      get().disconnect();
    }

    set({ connecting: true, error: null, myName: name });

    try {
      wsInstance = await WebSocket.connect(serverUrl);

      wsInstance.addListener((rawMsg) => {
        if (rawMsg.type === "Text") {
          try {
            const parsed: WsMessage = JSON.parse(rawMsg.data);
            handleIncoming(parsed, get, set);
          } catch (e) {
            console.error(e);
          }
        }
        if (rawMsg.type === "Close") {
          const state = get();
          if (state.connected) {
            set({
              connected: false,
              connecting: false,
              sessionCode: null,
              isOwner: false,
              myId: null,
              users: [],
              permissions: null,
              chatMessages: [],
              followingUserId: null,
            });
            wsInstance = null;
          }
        }
      });

      send({ type: "join_session", code: code.toUpperCase(), name });
    } catch (e) {
      set({ connecting: false, error: `Connection failed: ${e}` });
    }
  },

  disconnect: () => {
    if (wsInstance) {
      wsInstance.disconnect();
      wsInstance = null;
    }
    set({
      connected: false,
      connecting: false,
      sessionCode: null,
      isOwner: false,
      myId: null,
      users: [],
      permissions: null,
      chatMessages: [],
      followingUserId: null,
      error: null,
    });
  },

  sendSelectKey: (keyName) => {
    if (!get().connected) return;
    send({ type: "select_key", keyName, userId: get().myId ?? "" });
  },

  sendEditStringValue: (keyName, langCode, value) => {
    if (!get().connected) return;
    send({
      type: "edit_string_value",
      keyName,
      langCode,
      value,
      userId: get().myId ?? "",
    });
  },

  sendEditArrayElement: (keyName, langCode, index, value) => {
    if (!get().connected) return;
    send({
      type: "edit_array_element",
      keyName,
      langCode,
      index,
      value,
      userId: get().myId ?? "",
    });
  },

  sendAddArrayElement: (keyName) => {
    if (!get().connected) return;
    send({ type: "add_array_element", keyName, userId: get().myId ?? "" });
  },

  sendRemoveArrayElement: (keyName, index) => {
    if (!get().connected) return;
    send({
      type: "remove_array_element",
      keyName,
      index,
      userId: get().myId ?? "",
    });
  },

  sendRenameKey: (oldName, newName) => {
    if (!get().connected) return;
    send({ type: "rename_key", oldName, newName, userId: get().myId ?? "" });
  },

  sendDeleteKey: (keyName) => {
    if (!get().connected) return;
    send({ type: "delete_key", keyName, userId: get().myId ?? "" });
  },

  sendAddKey: (key) => {
    if (!get().connected) return;
    send({ type: "add_key", key, userId: get().myId ?? "" });
  },

  sendMoveKey: (sourceKeyName, targetKeyName) => {
    if (!get().connected) return;
    send({
      type: "move_key",
      sourceKeyName,
      targetKeyName,
      userId: get().myId ?? "",
    });
  },

  sendChat: (text) => {
    if (!get().connected) return;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      userId: get().myId ?? "",
      userName: get().myName,
      text,
      timestamp: Date.now(),
    };
    send({ type: "chat", message: msg });
  },

  followUser: (userId) => {
    set({ followingUserId: userId });
  },

  bringHere: (targetUserId) => {
    if (!get().connected) return;
    const selected = useEditorStore.getState().selectedKeyName;
    if (selected) {
      send({ type: "bring_here", targetUserId, keyName: selected });
    }
  },

  kickUser: (targetUserId) => {
    if (!get().connected || !get().isOwner) return;
    send({ type: "kick_user", targetUserId });
  },

  updatePermissions: (permissions) => {
    if (!get().connected || !get().isOwner) return;
    send({ type: "update_permissions", permissions });
    set({ permissions });
  },

  clearError: () => set({ error: null }),
}));
