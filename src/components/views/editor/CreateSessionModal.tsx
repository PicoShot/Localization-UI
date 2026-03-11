import { useState } from "react";
import {
  Dialog,
  Flex,
  Text,
  Button,
  Select,
  ScrollArea,
} from "@radix-ui/themes";
import { useEditorStore } from "@/stores/editorStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useSettingsStore } from "@/stores/settingsStore";
import type { SessionPermissions } from "@/lib/protocol";
import { GetLanguageName } from "@/utils/languages";

interface CreateSessionModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateSessionModal({ open, onClose }: CreateSessionModalProps) {
  const locales = useEditorStore((s) => s.locales);
  const createSession = useSessionStore((s) => s.createSession);
  const settings = useSettingsStore();

  const [permMode, setPermMode] = useState<"all" | "custom">("all");
  const [langPerms, setLangPerms] = useState<Record<string, "read" | "write">>(
    () => {
      const map: Record<string, "read" | "write"> = {};
      locales.forEach((l) => {
        map[l.languageCode] = "read";
      });
      return map;
    },
  );

  const handleCreate = () => {
    const permissions: SessionPermissions = {
      languagePermissions: permMode === "all" ? "all" : langPerms,
    };
    createSession(
      settings.sessionServerUrl,
      settings.sessionUserName,
      permissions,
    );
    onClose();
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
          Start a collaborative session for others to join.
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <Flex direction="column" gap="2">
            <Text size="2" weight="bold">
              Collaborator Permissions
            </Text>

            <Flex direction="column" gap="1">
              <Text size="2">Permission Mode</Text>
              <Select.Root
                value={permMode}
                onValueChange={(v) => setPermMode(v as "all" | "custom")}
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="all">
                    Full Access (All Languages)
                  </Select.Item>
                  <Select.Item value="custom">
                    Per-Language Permissions
                  </Select.Item>
                </Select.Content>
              </Select.Root>
            </Flex>

            {permMode === "custom" && (
              <Flex
                direction="column"
                gap="2"
                style={{ paddingLeft: "var(--space-2)" }}
              >
                <ScrollArea type="auto" style={{ flex: 1 }}>
                  {locales.map((locale) => (
                    <Flex
                      align="center"
                      justify="between"
                      gap="2"
                      key={locale.languageCode}
                    >
                      <Text size="2">
                        {GetLanguageName(locale.languageCode)}
                      </Text>
                      <Select.Root
                        size="1"
                        value={langPerms[locale.languageCode] ?? "write"}
                        onValueChange={(v) =>
                          setLangPerms((prev) => ({
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
                </ScrollArea>
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
            disabled={!settings.sessionUserName.trim()}
            style={{ cursor: "pointer" }}
          >
            Create
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
