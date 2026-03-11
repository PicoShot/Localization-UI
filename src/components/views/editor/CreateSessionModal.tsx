import { useState } from "react";
import {
  Dialog,
  Flex,
  Text,
  TextField,
  Button,
  Checkbox,
  Select,
} from "@radix-ui/themes";
import { useEditorStore } from "@/stores/editorStore";
import { useSessionStore } from "@/stores/sessionStore";
import type { SessionPermissions } from "@/lib/protocol";
import { GetLanguageName } from "@/utils/languages";

interface CreateSessionModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateSessionModal({ open, onClose }: CreateSessionModalProps) {
  const locales = useEditorStore((s) => s.locales);
  const createSession = useSessionStore((s) => s.createSession);

  const [name, setName] = useState("User");
  const [serverUrl, setServerUrl] = useState("ws://localhost:9001/ws");
  const [allowWrite, setAllowWrite] = useState(true);
  const [languageMode, setLanguageMode] = useState<"all" | "specific">("all");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const handleCreate = async () => {
    const permissions: SessionPermissions = {
      allowWrite,
      allowedLanguages: languageMode === "all" ? "all" : selectedLanguages,
    };
    await createSession(serverUrl, name, permissions);
    onClose();
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>Create Session</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Start a collaborative session and share the code with others.
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <Flex direction="column" gap="1">
            <Text size="2" weight="bold">
              Display Name
            </Text>
            <TextField.Root
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </Flex>

          <Flex direction="column" gap="1">
            <Text size="2" weight="bold">
              Server URL
            </Text>
            <TextField.Root
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="ws://localhost:9001/ws"
            />
          </Flex>

          <Flex direction="column" gap="2">
            <Text size="2" weight="bold">
              Permissions
            </Text>

            <Flex align="center" gap="2" asChild>
              <label>
                <Checkbox
                  checked={allowWrite}
                  onCheckedChange={(v) => setAllowWrite(v === true)}
                />
                <Text size="2">Allow collaborators to edit</Text>
              </label>
            </Flex>

            <Flex direction="column" gap="1">
              <Text size="2">Language Access</Text>
              <Select.Root
                value={languageMode}
                onValueChange={(v) => setLanguageMode(v as "all" | "specific")}
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="all">All Languages</Select.Item>
                  <Select.Item value="specific">Specific Languages</Select.Item>
                </Select.Content>
              </Select.Root>
            </Flex>

            {languageMode === "specific" && (
              <Flex
                direction="column"
                gap="1"
                style={{ paddingLeft: "var(--space-4)" }}
              >
                {locales.map((locale) => (
                  <Flex
                    align="center"
                    gap="2"
                    key={locale.languageCode}
                    asChild
                  >
                    <label>
                      <Checkbox
                        checked={selectedLanguages.includes(
                          locale.languageCode,
                        )}
                        onCheckedChange={() =>
                          toggleLanguage(locale.languageCode)
                        }
                      />
                      <Text size="2">
                        {GetLanguageName(locale.languageCode)}
                      </Text>
                    </label>
                  </Flex>
                ))}
              </Flex>
            )}
          </Flex>
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray" style={{ cursor: "pointer" }}>
              Cancel
            </Button>
          </Dialog.Close>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || !serverUrl.trim()}
            style={{ cursor: "pointer" }}
          >
            Create Session
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
