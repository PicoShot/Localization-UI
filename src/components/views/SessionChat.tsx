import { useState, useRef, useEffect } from "react";
import {
  Flex,
  Text,
  TextField,
  IconButton,
  ScrollArea,
  Box,
} from "@radix-ui/themes";
import { Send } from "lucide-react";
import { useSessionStore } from "@/stores/sessionStore";

export function SessionChat() {
  const chatMessages = useSessionStore((s) => s.chatMessages);
  const sendChat = useSessionStore((s) => s.sendChat);
  const myId = useSessionStore((s) => s.myId);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages.length]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendChat(trimmed);
    setInput("");
  };

  return (
    <Flex direction="column" style={{ height: "100%", minHeight: 0 }}>
      <Text size="2" weight="bold" mb="2">
        Chat
      </Text>
      <ScrollArea
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          border: "1px solid var(--gray-a5)",
          borderRadius: "var(--radius-2)",
          padding: "var(--space-2)",
        }}
      >
        <Flex direction="column" gap="1">
          {chatMessages.length === 0 && (
            <Text size="1" color="gray" style={{ fontStyle: "italic" }}>
              No messages yet
            </Text>
          )}
          {chatMessages.map((msg) => (
            <Box key={msg.id}>
              <Text size="1">
                <Text
                  weight="bold"
                  style={{
                    color:
                      msg.userId === myId
                        ? "var(--accent-11)"
                        : "var(--gray-11)",
                  }}
                >
                  {msg.userName}
                </Text>
                {": "}
                {msg.text}
              </Text>
            </Box>
          ))}
        </Flex>
      </ScrollArea>
      <Flex gap="2" mt="2" align="center">
        <TextField.Root
          size="1"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          style={{ flex: 1 }}
        />
        <IconButton
          size="1"
          variant="soft"
          onClick={handleSend}
          style={{ cursor: "pointer", flexShrink: 0 }}
        >
          <Send size={12} />
        </IconButton>
      </Flex>
    </Flex>
  );
}
