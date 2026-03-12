import { useState, useMemo } from "react";
import {
  Flex,
  Text,
  Button,
  Badge,
  Card,
  Box,
  IconButton,
  Tooltip,
  Separator,
  Select,
  TextField,
  ScrollArea,
} from "@radix-ui/themes";
import {
  LogOut,
  Crown,
  UserX,
  Eye,
  Navigation,
  Copy,
  Plus,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useSessionStore } from "@/stores/sessionStore";
import { useEditorStore } from "@/stores/editorStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { SessionChat } from "./SessionChat";
import { CreateSessionModal } from "./editor/CreateSessionModal";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { GetLanguageName } from "@/utils/languages";

export function SessionView() {
  const store = useSessionStore();
  const locales = useEditorStore((s) => s.locales);
  const accentColor = useSettingsStore((s) => s.accentColor);
  const settings = useSettingsStore();
  const isLoaded = useEditorStore((s) => s.locales.length > 0);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [editingPerms, setEditingPerms] = useState(false);
  const [permLangMap, setPermLangMap] = useState<
    Record<string, "read" | "write">
  >({});

  const handleJoin = () => {
    if (!joinCode.trim() || !settings.sessionUserName.trim()) return;
    store.joinSession(
      settings.sessionServerUrl,
      joinCode,
      settings.sessionUserName,
    );
  };

  const handleCopyCode = () => {
    if (store.sessionCode) {
      writeText(store.sessionCode);
    }
  };

  const startEditPerms = () => {
    if (store.permissions) {
      const perms = store.permissions.languagePermissions;
      if (perms === "all") {
        const map: Record<string, "read" | "write"> = {};
        locales.forEach((l) => {
          map[l.languageCode] = "write";
        });
        setPermLangMap(map);
      } else {
        setPermLangMap({ ...perms });
      }
    }
    setEditingPerms(true);
  };

  const savePerms = () => {
    const allWrite =
      Object.values(permLangMap).every((v) => v === "write") &&
      Object.keys(permLangMap).length === locales.length;
    store.updatePermissions({
      languagePermissions: allWrite ? "all" : permLangMap,
    });
    setEditingPerms(false);
  };

  const permsSummary = useMemo(() => {
    if (!store.permissions) return "";
    const perms = store.permissions.languagePermissions;
    if (perms === "all") return "Full access (all languages)";
    const entries = Object.entries(perms);
    if (entries.length === 0) return "No access";
    return entries
      .map(([lang, mode]) => `${GetLanguageName(lang)}: ${mode}`)
      .join(", ");
  }, [store.permissions]);

  if (!store.connected && !store.connecting) {
    return (
      <ScrollArea style={{ height: "100%" }}>
        <Flex direction="column" gap="4" p="4">
          <Flex align="center" gap="2">
            <WifiOff size={16} />
            <Text size="3" weight="bold">
              Sessions
            </Text>
          </Flex>

          {store.error && (
            <Card
              style={{
                backgroundColor: "var(--red-a3)",
                border: "1px solid var(--red-a6)",
              }}
            >
              <Text size="2" color="red">
                {store.error}
              </Text>
            </Card>
          )}

          <Flex direction="column" gap="1">
            <Text size="2" weight="bold">
              Display Name
            </Text>
            <TextField.Root
              size="2"
              value={settings.sessionUserName}
              onChange={(e) => settings.setSessionUserName(e.target.value)}
              placeholder="Your name"
            />
          </Flex>

          <Flex gap="4" style={{ minHeight: 0 }}>
            {isLoaded && (
              <Flex direction="column" gap="3" style={{ flex: 1, minWidth: 0 }}>
                <Separator size="4" />
                <Text size="2" weight="bold">
                  Host a Session
                </Text>
                <Text size="1" color="gray">
                  Share your current project with collaborators
                </Text>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  disabled={!settings.sessionUserName.trim()}
                  style={{ cursor: "pointer" }}
                >
                  <Plus size={14} />
                  Create Session
                </Button>
              </Flex>
            )}

            <Flex direction="column" gap="3" style={{ flex: 1, minWidth: 0 }}>
              <Separator size="4" />
              <Text size="2" weight="bold">
                Join a Session
              </Text>

              <Flex direction="column" gap="1">
                <Text size="1" color="gray">
                  Session Code
                </Text>
                <TextField.Root
                  size="2"
                  value={joinCode}
                  onChange={(e) =>
                    setJoinCode(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 6),
                    )
                  }
                  placeholder="ABC123"
                  maxLength={6}
                  style={{
                    fontFamily: "monospace",
                    letterSpacing: "0.2em",
                    fontWeight: "bold",
                  }}
                />
              </Flex>

              <Button
                onClick={handleJoin}
                disabled={
                  joinCode.length !== 6 || !settings.sessionUserName.trim()
                }
                style={{ cursor: "pointer" }}
              >
                Join Session
              </Button>
            </Flex>
          </Flex>

          <CreateSessionModal
            open={showCreateModal}
            onClose={() => setShowCreateModal(false)}
          />
        </Flex>
      </ScrollArea>
    );
  }

  if (store.connecting) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap="3"
        p="4"
        style={{ height: "100%" }}
      >
        <Text size="2" color="gray">
          Connecting...
        </Text>
      </Flex>
    );
  }

  return (
    <Flex gap="4" p="4" style={{ height: "100%", minHeight: 0 }}>
      <Flex
        direction="column"
        gap="3"
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <Flex align="center" gap="2">
          <Wifi size={16} color="var(--green-11)" />
          <Text size="3" weight="bold">
            Session
          </Text>
        </Flex>

        <Card>
          <Flex direction="column" gap="2">
            <Flex align="center" justify="between">
              <Text size="1" color="gray">
                Session Code
              </Text>
              <Flex align="center" gap="1">
                <Badge
                  size="2"
                  color={accentColor as never}
                  style={{
                    fontFamily: "monospace",
                    fontSize: "16px",
                    letterSpacing: "0.15em",
                  }}
                >
                  {store.sessionCode}
                </Badge>
                <Tooltip content="Copy code">
                  <IconButton
                    size="1"
                    variant="ghost"
                    onClick={handleCopyCode}
                    style={{ cursor: "pointer" }}
                  >
                    <Copy size={12} />
                  </IconButton>
                </Tooltip>
              </Flex>
            </Flex>
          </Flex>
        </Card>

        <Flex direction="column" gap="1">
          <Text size="2" weight="bold">
            Users ({store.users.length})
          </Text>
          <Flex direction="column" gap="1">
            {store.users.map((user) => (
              <Flex
                key={user.id}
                align="center"
                gap="2"
                style={{
                  padding: "4px 8px",
                  borderRadius: "var(--radius-2)",
                  backgroundColor: "var(--gray-a2)",
                }}
              >
                <Box
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: user.color,
                    flexShrink: 0,
                  }}
                />
                <Text size="1" style={{ flex: 1 }}>
                  {user.name}
                  {user.id === store.myId && " (You)"}
                </Text>
                {user.id === store.myId && (
                  <Badge size="1" color="amber" variant="soft">
                    <Crown size={10} /> Owner
                  </Badge>
                )}
                {user.selectedKey && (
                  <Tooltip content={`Editing: ${user.selectedKey}`}>
                    <Text
                      size="1"
                      color="gray"
                      style={{
                        maxWidth: 60,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {user.selectedKey}
                    </Text>
                  </Tooltip>
                )}
                {user.id !== store.myId && (
                  <Flex gap="1">
                    <Tooltip
                      content={
                        store.followingUserId === user.id
                          ? "Unfollow"
                          : "Follow"
                      }
                    >
                      <IconButton
                        size="1"
                        variant="ghost"
                        color={
                          store.followingUserId === user.id
                            ? (accentColor as never)
                            : "gray"
                        }
                        onClick={() =>
                          store.followUser(
                            store.followingUserId === user.id ? null : user.id,
                          )
                        }
                        style={{ cursor: "pointer" }}
                      >
                        <Eye size={15} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip content="Bring here">
                      <IconButton
                        size="1"
                        variant="ghost"
                        onClick={() => store.bringHere(user.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <Navigation size={15} />
                      </IconButton>
                    </Tooltip>
                    {store.isOwner && (
                      <Tooltip content="Kick">
                        <IconButton
                          size="1"
                          variant="ghost"
                          color="red"
                          onClick={() => store.kickUser(user.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <UserX size={15} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Flex>
                )}
              </Flex>
            ))}
          </Flex>
        </Flex>

        {store.isOwner && (
          <Flex
            direction="column"
            gap="1"
            style={{ width: "100%", minWidth: 0 }}
          >
            <Flex align="center" justify="between" style={{ width: "100%" }}>
              <Text size="2" weight="bold">
                Permissions
              </Text>
              {!editingPerms ? (
                <Button
                  size="1"
                  variant="ghost"
                  onClick={startEditPerms}
                  style={{ cursor: "pointer", flexShrink: 0 }}
                >
                  Edit
                </Button>
              ) : (
                <Button
                  size="1"
                  variant="soft"
                  onClick={savePerms}
                  style={{ cursor: "pointer", flexShrink: 0 }}
                >
                  Save
                </Button>
              )}
            </Flex>
            {!editingPerms ? (
              <Box style={{ width: "100%", minWidth: 0 }}>
                <Text
                  as="p"
                  size="1"
                  color="gray"
                  style={{
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                    whiteSpace: "pre-wrap",
                    width: "100%",
                  }}
                >
                  {permsSummary}
                </Text>
              </Box>
            ) : (
              <ScrollArea style={{ maxHeight: "250px" }}>
                <Flex direction="column" gap="2" pr="3">
                  {locales.map((locale) => (
                    <Flex
                      align="center"
                      justify="between"
                      gap="2"
                      key={locale.languageCode}
                    >
                      <Text size="1">
                        {GetLanguageName(locale.languageCode)}
                      </Text>
                      <Select.Root
                        size="1"
                        value={permLangMap[locale.languageCode] ?? "write"}
                        onValueChange={(v) =>
                          setPermLangMap((prev) => ({
                            ...prev,
                            [locale.languageCode]: v as "read" | "write",
                          }))
                        }
                      >
                        <Select.Trigger />
                        <Select.Content>
                          <Select.Item value="write">Read & Write</Select.Item>
                          <Select.Item value="read">Read Only</Select.Item>
                        </Select.Content>
                      </Select.Root>
                    </Flex>
                  ))}
                </Flex>
              </ScrollArea>
            )}
          </Flex>
        )}

        {!store.isOwner && store.permissions && (
          <Flex
            direction="column"
            gap="1"
            style={{ width: "100%", minWidth: 0 }}
          >
            <Text size="2" weight="bold">
              Permissions
            </Text>
            <Box style={{ width: "100%", minWidth: 0 }}>
              <Text
                as="p"
                size="1"
                color="gray"
                style={{
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  whiteSpace: "pre-wrap",
                  width: "100%",
                }}
              >
                {permsSummary}
              </Text>
            </Box>
          </Flex>
        )}

        <Box style={{ flex: 1 }} />

        <Button
          variant="outline"
          color="red"
          onClick={store.disconnect}
          style={{ cursor: "pointer" }}
        >
          <LogOut size={14} />
          {store.isOwner ? "End Session" : "Leave Session"}
        </Button>
      </Flex>

      <Box
        style={{
          width: "1px",
          backgroundColor: "var(--gray-a5)",
          flexShrink: 0,
        }}
      />

      <Flex direction="column" style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
        <SessionChat />
      </Flex>
    </Flex>
  );
}
