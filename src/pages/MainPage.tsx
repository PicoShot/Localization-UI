import { useState } from "react";
import {
  Flex,
  Heading,
  Text,
  Card,
  TextField,
  Button,
  Separator,
} from "@radix-ui/themes";
import { DragDropZone } from "@/components/DragDropZone";
import { useEditorStore } from "@/stores/editorStore";
import { useSessionStore } from "@/stores/sessionStore";

export function MainPage() {
  const loadError = useEditorStore((s) => s.loadError);
  const sessionError = useSessionStore((s) => s.error);
  const connecting = useSessionStore((s) => s.connecting);
  const joinSession = useSessionStore((s) => s.joinSession);

  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("User");
  const [joinServerUrl, setJoinServerUrl] = useState("ws://localhost:9001/ws");

  const handleJoin = () => {
    if (!joinCode.trim() || !joinName.trim()) return;
    joinSession(joinServerUrl, joinCode, joinName);
  };

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      gap="5"
      style={{
        height: "100%",
        width: "100%",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <Flex direction="column" align="center" gap="2">
        <Heading size="8" align="center">
          PicoShot Localization
        </Heading>
        <Text size="4" color="gray" align="center">
          Start by dropping your game's .bloc files or folders to edit.
        </Text>
      </Flex>

      <div style={{ width: "100%", minHeight: "250px" }}>
        <DragDropZone />
      </div>

      {loadError && (
        <Card
          style={{
            backgroundColor: "var(--red-a3)",
            borderColor: "var(--red-a6)",
            border: "1px solid",
            width: "100%",
          }}
        >
          <Text color="red" weight="bold" align="center" as="p">
            Error: {loadError}
          </Text>
        </Card>
      )}

      <Separator size="4" />

      <Card style={{ width: "100%", maxWidth: "400px" }}>
        <Flex direction="column" gap="3">
          <Heading size="4" align="center">
            Join a Session
          </Heading>
          <Text size="2" color="gray" align="center">
            Enter a session code to collaborate with others
          </Text>

          {sessionError && (
            <Text size="2" color="red" align="center">
              {sessionError}
            </Text>
          )}

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
              size="3"
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
                letterSpacing: "0.25em",
                fontWeight: "bold",
                textAlign: "center",
                fontSize: "20px",
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
            size="3"
            onClick={handleJoin}
            disabled={joinCode.length !== 6 || !joinName.trim() || connecting}
            style={{ cursor: "pointer" }}
          >
            {connecting ? "Connecting..." : "Join Session"}
          </Button>
        </Flex>
      </Card>
    </Flex>
  );
}
