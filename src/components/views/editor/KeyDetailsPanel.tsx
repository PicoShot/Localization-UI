import { useMemo } from "react";
import { Flex, Box, Text, Heading, ScrollArea } from "@radix-ui/themes";
import { LocaleData } from "@/lib/bloc";
import { UnifiedKey } from "@/types/types";
import { StringKeyEditor } from "./StringKeyEditor";
import { ArrayKeyEditor } from "./ArrayKeyEditor";
import { useEditorStore } from "@/stores/editorStore";
import { useSessionStore } from "@/stores/sessionStore";

interface KeyDetailsPanelProps {
  locales: LocaleData[];
  selectedKey: UnifiedKey | null;
}

export function KeyDetailsPanel({
  locales,
  selectedKey,
}: KeyDetailsPanelProps) {
  const setStringValue = useEditorStore((s) => s.setStringValue);
  const setArrayElement = useEditorStore((s) => s.setArrayElement);
  const removeArrayElement = useEditorStore((s) => s.removeArrayElement);
  const addArrayElement = useEditorStore((s) => s.addArrayElement);
  const clearEmptyArrayElements = useEditorStore(
    (s) => s.clearEmptyArrayElements,
  );
  const session = useSessionStore();
  const permissions = useSessionStore((s) => s.permissions);
  const connected = useSessionStore((s) => s.connected);
  const isOwner = useSessionStore((s) => s.isOwner);

  const readOnlyLanguages = useMemo(() => {
    const set = new Set<string>();
    if (!connected || isOwner || !permissions) return set;
    const perms = permissions.languagePermissions;
    if (perms === "all") return set;
    for (const locale of locales) {
      if (perms[locale.languageCode] !== "write") {
        set.add(locale.languageCode);
      }
    }
    return set;
  }, [connected, isOwner, permissions, locales]);

  if (!selectedKey) {
    return (
      <Flex
        align="center"
        justify="center"
        style={{ height: "100%", color: "var(--gray-9)" }}
      >
        <Text>Select a key to view or edit details</Text>
      </Flex>
    );
  }

  const keyName = selectedKey.name;

  const handleStringChange = (langCode: string, newValue: string) => {
    if (readOnlyLanguages.has(langCode)) return;
    setStringValue(keyName, langCode, newValue);
    session.sendEditStringValue(keyName, langCode, newValue);
  };

  const handleArrayElementChange = (
    langCode: string,
    index: number,
    newValue: string,
  ) => {
    if (readOnlyLanguages.has(langCode)) return;
    setArrayElement(keyName, langCode, index, newValue);
    session.sendEditArrayElement(keyName, langCode, index, newValue);
  };

  const handleRemoveElement = (index: number) => {
    removeArrayElement(keyName, index);
    session.sendRemoveArrayElement(keyName, index);
  };

  const handleAddElement = () => {
    addArrayElement(keyName);
    session.sendAddArrayElement(keyName);
  };

  return (
    <ScrollArea type="auto" style={{ flex: 1 }}>
      <Flex direction="column" p="5" gap="4">
        <Box>
          <Text size="2" color="gray">
            Selected Key
          </Text>
          <Heading size="6" style={{ wordBreak: "break-all" }}>
            {selectedKey.name}
          </Heading>
        </Box>

        {selectedKey.type === "string" && (
          <StringKeyEditor
            locales={locales}
            selectedKey={selectedKey}
            onChange={handleStringChange}
            readOnlyLanguages={readOnlyLanguages}
          />
        )}

        {selectedKey.type === "array" && (
          <ArrayKeyEditor
            locales={locales}
            selectedKey={selectedKey}
            onElementChange={handleArrayElementChange}
            onRemoveElement={handleRemoveElement}
            onAddElement={handleAddElement}
            onClearEmpty={() => clearEmptyArrayElements(keyName)}
            readOnlyLanguages={readOnlyLanguages}
          />
        )}
      </Flex>
    </ScrollArea>
  );
}
