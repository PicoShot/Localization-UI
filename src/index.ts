import type {
  WsMessage,
  SessionPermissions,
  SessionUser,
  SerializedKey,
  SerializedLocale,
  ChatMessage,
} from "./protocol";

const USER_COLORS = [
  "#e06c75",
  "#98c379",
  "#e5c07b",
  "#61afef",
  "#c678dd",
  "#56b6c2",
  "#be5046",
  "#d19a66",
  "#7ec699",
  "#a9b2c3",
  "#f08080",
  "#90ee90",
  "#ffd700",
  "#87ceeb",
  "#dda0dd",
];

interface Session {
  code: string;
  ownerId: string;
  permissions: SessionPermissions;
  keys: SerializedKey[];
  locales: SerializedLocale[];
  users: Map<string, { user: SessionUser; ws: ServerWebSocket<WsData> }>;
  chatHistory: ChatMessage[];
  colorIndex: number;
}

interface WsData {
  userId: string;
  sessionCode: string | null;
}

type ServerWebSocket<T> = Bun.ServerWebSocket<T>;

const sessions = new Map<string, Session>();

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code: string;
  do {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (sessions.has(code));
  return code;
}

function generateUserId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

function nextColor(session: Session): string {
  const color = USER_COLORS[session.colorIndex % USER_COLORS.length]!;
  session.colorIndex++;
  return color;
}

function broadcast(session: Session, msg: WsMessage, excludeUserId?: string) {
  const raw = JSON.stringify(msg);
  for (const [uid, entry] of session.users) {
    if (uid !== excludeUserId) {
      entry.ws.send(raw);
    }
  }
}

function sendTo(ws: ServerWebSocket<WsData>, msg: WsMessage) {
  ws.send(JSON.stringify(msg));
}

function sendError(ws: ServerWebSocket<WsData>, message: string) {
  sendTo(ws, { type: "error", message });
}

function checkWritePermission(
  session: Session,
  userId: string,
  langCode?: string,
): boolean {
  if (userId === session.ownerId) return true;
  const perms = session.permissions.languagePermissions;
  if (perms === "all") return true;
  if (langCode) {
    return perms[langCode] === "write";
  }
  return Object.values(perms).some((p) => p === "write");
}

function checkWritePermissionGeneral(
  session: Session,
  userId: string,
): boolean {
  if (userId === session.ownerId) return true;
  const perms = session.permissions.languagePermissions;
  if (perms === "all") return true;
  return Object.values(perms).some((p) => p === "write");
}

function handleMessage(ws: ServerWebSocket<WsData>, raw: string) {
  let msg: WsMessage;
  try {
    msg = JSON.parse(raw);
  } catch {
    sendError(ws, "Invalid JSON");
    return;
  }

  const userId = ws.data.userId;

  switch (msg.type) {
    case "create_session": {
      if (ws.data.sessionCode) {
        sendError(ws, "Already in a session");
        return;
      }

      const code = generateCode();
      const user: SessionUser = {
        id: userId,
        name: msg.name,
        color: USER_COLORS[0]!,
        selectedKey: null,
      };

      const session: Session = {
        code,
        ownerId: userId,
        permissions: msg.permissions,
        keys: msg.keys,
        locales: msg.locales,
        users: new Map(),
        chatHistory: [],
        colorIndex: 1,
      };

      session.users.set(userId, { user, ws });
      sessions.set(code, session);
      ws.data.sessionCode = code;

      sendTo(ws, { type: "session_created", code, user });
      break;
    }

    case "join_session": {
      if (ws.data.sessionCode) {
        sendError(ws, "Already in a session");
        return;
      }

      const session = sessions.get(msg.code.toUpperCase());
      if (!session) {
        sendError(ws, "Session not found");
        return;
      }

      const user: SessionUser = {
        id: userId,
        name: msg.name,
        color: nextColor(session),
        selectedKey: null,
      };

      session.users.set(userId, { user, ws });
      ws.data.sessionCode = session.code;

      broadcast(session, { type: "user_joined", user }, userId);

      const userList = Array.from(session.users.values()).map((e) => e.user);
      sendTo(ws, {
        type: "session_joined",
        code: session.code,
        user,
        users: userList,
        permissions: session.permissions,
        keys: session.keys,
        locales: session.locales,
      });
      break;
    }

    case "edit_string_value": {
      const session = sessions.get(ws.data.sessionCode ?? "");
      if (!session) return;
      if (!checkWritePermission(session, userId, msg.langCode)) {
        sendError(ws, "No write permission for this language");
        return;
      }

      const key = session.keys.find((k) => k.name === msg.keyName);
      if (key) {
        key.values[msg.langCode] = msg.value;
      }

      broadcast(session, { ...msg, userId }, userId);
      break;
    }

    case "edit_array_element": {
      const session = sessions.get(ws.data.sessionCode ?? "");
      if (!session) return;
      if (!checkWritePermission(session, userId, msg.langCode)) {
        sendError(ws, "No write permission for this language");
        return;
      }

      const key = session.keys.find((k) => k.name === msg.keyName);
      if (key) {
        const arr = key.values[msg.langCode];
        if (Array.isArray(arr)) {
          arr[msg.index] = msg.value;
        }
      }

      broadcast(session, { ...msg, userId }, userId);
      break;
    }

    case "add_array_element": {
      const session = sessions.get(ws.data.sessionCode ?? "");
      if (!session) return;
      if (!checkWritePermissionGeneral(session, userId)) {
        sendError(ws, "No write permission");
        return;
      }

      const key = session.keys.find((k) => k.name === msg.keyName);
      if (key) {
        for (const locale of session.locales) {
          const arr = key.values[locale.languageCode];
          if (Array.isArray(arr)) {
            arr.push("");
          } else {
            key.values[locale.languageCode] = [""];
          }
        }
      }

      broadcast(session, { ...msg, userId }, userId);
      break;
    }

    case "remove_array_element": {
      const session = sessions.get(ws.data.sessionCode ?? "");
      if (!session) return;
      if (!checkWritePermissionGeneral(session, userId)) {
        sendError(ws, "No write permission");
        return;
      }

      const key = session.keys.find((k) => k.name === msg.keyName);
      if (key) {
        for (const locale of session.locales) {
          const arr = key.values[locale.languageCode];
          if (Array.isArray(arr)) {
            arr.splice(msg.index, 1);
          }
        }
      }

      broadcast(session, { ...msg, userId }, userId);
      break;
    }

    case "rename_key": {
      const session = sessions.get(ws.data.sessionCode ?? "");
      if (!session) return;
      if (!checkWritePermissionGeneral(session, userId)) {
        sendError(ws, "No write permission");
        return;
      }

      const key = session.keys.find((k) => k.name === msg.oldName);
      if (key) {
        key.name = msg.newName;
      }

      broadcast(session, { ...msg, userId }, userId);
      break;
    }

    case "delete_key": {
      const session = sessions.get(ws.data.sessionCode ?? "");
      if (!session) return;
      if (!checkWritePermissionGeneral(session, userId)) {
        sendError(ws, "No write permission");
        return;
      }

      session.keys = session.keys.filter((k) => k.name !== msg.keyName);
      broadcast(session, { ...msg, userId }, userId);
      break;
    }

    case "add_key": {
      const session = sessions.get(ws.data.sessionCode ?? "");
      if (!session) return;
      if (!checkWritePermissionGeneral(session, userId)) {
        sendError(ws, "No write permission");
        return;
      }

      session.keys.push(msg.key);
      broadcast(session, { ...msg, userId }, userId);
      break;
    }

    case "move_key": {
      const session = sessions.get(ws.data.sessionCode ?? "");
      if (!session) return;
      if (!checkWritePermissionGeneral(session, userId)) {
        sendError(ws, "No write permission");
        return;
      }

      const srcIdx = session.keys.findIndex(
        (k) => k.name === msg.sourceKeyName,
      );
      const tgtIdx = session.keys.findIndex(
        (k) => k.name === msg.targetKeyName,
      );
      if (srcIdx !== -1 && tgtIdx !== -1 && srcIdx !== tgtIdx) {
        const [moved] = session.keys.splice(srcIdx, 1);
        session.keys.splice(tgtIdx, 0, moved!);
      }

      broadcast(session, { ...msg, userId }, userId);
      break;
    }

    case "select_key": {
      const session = sessions.get(ws.data.sessionCode ?? "");
      if (!session) return;

      const entry = session.users.get(userId);
      if (entry) {
        entry.user.selectedKey = msg.keyName;
      }

      broadcast(session, { ...msg, userId }, userId);
      break;
    }

    case "chat": {
      const session = sessions.get(ws.data.sessionCode ?? "");
      if (!session) return;

      const chatMsg: ChatMessage = {
        ...msg.message,
        userId,
        timestamp: Date.now(),
      };
      session.chatHistory.push(chatMsg);

      broadcast(session, { type: "chat", message: chatMsg });
      break;
    }

    case "bring_here": {
      const session = sessions.get(ws.data.sessionCode ?? "");
      if (!session) return;

      const target = session.users.get(msg.targetUserId);
      if (target) {
        const senderEntry = session.users.get(userId);
        sendTo(target.ws, {
          type: "brought_here",
          keyName: msg.keyName,
          byUserName: senderEntry?.user.name ?? "Unknown",
        });
      }
      break;
    }

    case "kick_user": {
      const session = sessions.get(ws.data.sessionCode ?? "");
      if (!session) return;
      if (userId !== session.ownerId) {
        sendError(ws, "Only the session owner can kick users");
        return;
      }

      const target = session.users.get(msg.targetUserId);
      if (target) {
        sendTo(target.ws, { type: "kicked" });
        session.users.delete(msg.targetUserId);
        target.ws.data.sessionCode = null;
        target.ws.close();
        broadcast(session, { type: "user_left", userId: msg.targetUserId });
      }
      break;
    }

    case "update_permissions": {
      const session = sessions.get(ws.data.sessionCode ?? "");
      if (!session) return;
      if (userId !== session.ownerId) {
        sendError(ws, "Only the session owner can update permissions");
        return;
      }

      session.permissions = msg.permissions;
      broadcast(session, {
        type: "permissions_changed",
        permissions: msg.permissions,
      });
      break;
    }

    default:
      sendError(ws, `Unknown message type: ${(msg as WsMessage).type}`);
  }
}

function handleDisconnect(ws: ServerWebSocket<WsData>) {
  const { userId, sessionCode } = ws.data;
  if (!sessionCode) return;

  const session = sessions.get(sessionCode);
  if (!session) return;

  session.users.delete(userId);

  if (userId === session.ownerId) {
    for (const [, entry] of session.users) {
      sendTo(entry.ws, { type: "kicked" });
      entry.ws.data.sessionCode = null;
      entry.ws.close();
    }
    sessions.delete(sessionCode);
  } else {
    broadcast(session, { type: "user_left", userId });
    if (session.users.size === 0) {
      sessions.delete(sessionCode);
    }
  }
}

const PORT = Number(process.env.PORT) || 9001;

Bun.serve<WsData>({
  port: PORT,
  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === "/ws") {
      const upgraded = server.upgrade(req, {
        data: { userId: generateUserId(), sessionCode: null } as WsData,
      });
      if (upgraded) return undefined;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }
    return new Response("Localization UI Session Server", { status: 200 });
  },
  websocket: {
    open(_ws) {},
    message(ws, raw) {
      handleMessage(
        ws,
        typeof raw === "string" ? raw : new TextDecoder().decode(raw),
      );
    },
    close(ws) {
      handleDisconnect(ws);
    },
  },
});

console.log(`Session server running on port ${PORT}`);
