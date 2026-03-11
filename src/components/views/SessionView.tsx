import { useState } from "react";
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
  Checkbox,
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

export function SessionView() {
  const store = useSessionStore();
  const locales = useEditorStore((s) => s.locales);
  const accentColor = useSettingsStore((s) => s.accentColor);
  const isLoaded = useEditorStore((s) => s.locales.length > 0);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("User");
  const [joinServerUrl, setJoinServerUrl] = useState("ws://localhost:9001/ws");
  const [editingPerms, setEditingPerms] = useState(false);
  const [permWrite, setPermWrite] = useState(true);
  const [permLangMode, setPermLangMode] = useState<"all" | "specific">("all");
  const [permLangs, setPermLangs] = useState<string[]>([]);

  const handleJoin = () => {
    if (!joinCode.trim() || !joinName.trim()) return;
    store.joinSession(joinServerUrl, joinCode, joinName);
  };

  const handleCopyCode = () => {
    if (store.sessionCode) {
      writeText(store.sessionCode);
    }
  };

  const startEditPerms = () => {
    if (store.permissions) {
      setPermWrite(store.permissions.allowWrite);
      setPermLangMode(
        store.permissions.allowedLanguages === "all" ? "all" : "specific",
      );
      setPermLangs(
        store.permissions.allowedLanguages === "all"
          ? []
          : store.permissions.allowedLanguages,
      );
    }
    setEditingPerms(true);
  };

  const savePerms = () => {
    store.updatePermissions({
      allowWrite: permWrite,
      allowedLanguages: permLangMode === "all" ? "all" : permLangs,
    });
    setEditingPerms(false);
  };

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

          {isLoaded && (
            <>
              <Separator size="4" />
              <Flex direction="column" gap="2">
                <Text size="2" weight="bold">
                  Host a Session
                </Text>
                <Text size="1" color="gray">
                  Share your current project with collaborators
                </Text>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  style={{ cursor: "pointer" }}
                >
                  <Plus size={14} />
                  Create Session
                </Button>
              </Flex>
            </>
          )}

          <Separator size="4" />

          <Flex direction="column" gap="2">
            <Text size="2" weight="bold">
              Join a Session
            </Text>

            <Flex direction="column" gap="1">
              <Text size="1" color="gray">
                Server URL
              </Text>
              <TextField.Root
                size="2"
                value={joinServerUrl}
                onChange={(e) => setJoinServerUrl(e.target.value)}
                placeholder="ws://localhost:9001/ws"
              />
            </Flex>

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

            <Flex direction="column" gap="1">
              <Text size="1" color="gray">
                Display Name
              </Text>
              <TextField.Root
                size="2"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Your name"
              />
            </Flex>

            <Button
              onClick={handleJoin}
              disabled={joinCode.length !== 6 || !joinName.trim()}
              style={{ cursor: "pointer" }}
            >
              Join Session
            </Button>
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
    <Flex
      direction="column"
      gap="3"
      p="4"
      style={{ height: "100%", minHeight: 0 }}
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
          {store.isOwner && (
            <Badge size="1" color="amber" variant="soft">
              <Crown size={10} /> Owner
            </Badge>
          )}
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
                      store.followingUserId === user.id ? "Unfollow" : "Follow"
                    }
                  >
                    <IconButton
                      size="1"
                      variant={
                        store.followingUserId === user.id ? "solid" : "ghost"
                      }
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
                      <Eye size={10} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip content="Bring here">
                    <IconButton
                      size="1"
                      variant="ghost"
                      onClick={() => store.bringHere(user.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <Navigation size={10} />
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
                        <UserX size={10} />
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
        <Flex direction="column" gap="1">
          <Flex align="center" justify="between">
            <Text size="2" weight="bold">
              Permissions
            </Text>
            {!editingPerms ? (
              <Button
                size="1"
                variant="ghost"
                onClick={startEditPerms}
                style={{ cursor: "pointer" }}
              >
                Edit
              </Button>
            ) : (
              <Button
                size="1"
                variant="soft"
                onClick={savePerms}
                style={{ cursor: "pointer" }}
              >
                Save
              </Button>
            )}
          </Flex>
          {!editingPerms ? (
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">
                Write: {store.permissions?.allowWrite ? "Allowed" : "Read-only"}
              </Text>
              <Text size="1" color="gray">
                Languages:{" "}
                {store.permissions?.allowedLanguages === "all"
                  ? "All"
                  : (store.permissions?.allowedLanguages ?? []).join(", ")}
              </Text>
            </Flex>
          ) : (
            <Flex direction="column" gap="2">
              <Flex align="center" gap="2" asChild>
                <label>
                  <Checkbox
                    checked={permWrite}
                    onCheckedChange={(v) => setPermWrite(v === true)}
                  />
                  <Text size="1">Allow write</Text>
                </label>
              </Flex>
              <Select.Root
                value={permLangMode}
                onValueChange={(v) => setPermLangMode(v as "all" | "specific")}
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="all">All Languages</Select.Item>
                  <Select.Item value="specific">Specific Languages</Select.Item>
                </Select.Content>
              </Select.Root>
              {permLangMode === "specific" &&
                locales.map((locale) => (
                  <Flex
                    align="center"
                    gap="2"
                    key={locale.languageCode}
                    asChild
                  >
                    <label>
                      <Checkbox
                        checked={permLangs.includes(locale.languageCode)}
                        onCheckedChange={() =>
                          setPermLangs((p) =>
                            p.includes(locale.languageCode)
                              ? p.filter((l) => l !== locale.languageCode)
                              : [...p, locale.languageCode],
                          )
                        }
                      />
                      <Text size="1">{locale.languageCode}</Text>
                    </label>
                  </Flex>
                ))}
            </Flex>
          )}
        </Flex>
      )}

      {!store.isOwner && store.permissions && (
        <Flex direction="column" gap="1">
          <Text size="2" weight="bold">
            Permissions
          </Text>
          <Text size="1" color="gray">
            Write: {store.permissions.allowWrite ? "Allowed" : "Read-only"}
          </Text>
          <Text size="1" color="gray">
            Languages:{" "}
            {store.permissions.allowedLanguages === "all"
              ? "All"
              : store.permissions.allowedLanguages.join(", ")}
          </Text>
        </Flex>
      )}

      <Box style={{ flex: 1, minHeight: 120 }}>
        <SessionChat />
      </Box>

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
  );
}
