import {
  Flex,
  Box,
  Text,
  Heading,
  ScrollArea,
  TextArea,
  Button,
} from "@radix-ui/themes";
import { Edit2, Languages, Copy, Code2, Eraser, Trash2 } from "lucide-react";
import { LocaleData } from "../../../lib/bloc";
import { UnifiedKey } from "./types";
import { StringKeyEditor } from "./StringKeyEditor";
import { ArrayKeyEditor } from "./ArrayKeyEditor";
import { useEditorStore } from "../../../stores/editorStore";

interface KeyDetailsPanelProps {
  locales: LocaleData[];
  selectedKey: UnifiedKey | null;
}

export function KeyDetailsPanel({
  locales,
  selectedKey,
}: KeyDetailsPanelProps) {
  const deleteSelectedKey = useEditorStore((s) => s.deleteSelectedKey);
  const setStringValue = useEditorStore((s) => s.setStringValue);
  const setArrayElement = useEditorStore((s) => s.setArrayElement);
  const removeArrayElement = useEditorStore((s) => s.removeArrayElement);
  const addArrayElement = useEditorStore((s) => s.addArrayElement);
  const clearEmptyArrayElements = useEditorStore((s) => s.clearEmptyArrayElements);

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

        <Box>
          <Text
            as="label"
            size="2"
            weight="bold"
            color="gray"
            mb="1"
            style={{ display: "block" }}
          >
            Translation Hint
          </Text>
          <TextArea placeholder="Context for translators/DeepL..." size="2" />
        </Box>

        <Flex
          gap="2"
          wrap="wrap"
          align="center"
          style={{
            borderBottom: "1px solid var(--gray-a4)",
            paddingBottom: "16px",
          }}
        >
          <Button variant="soft" size="1" color="gray">
            <Edit2 size={14} /> Rename
          </Button>
          <Button variant="soft" size="1" color="blue">
            <Languages size={14} /> Translate
          </Button>
          <Button variant="soft" size="1" color="gray">
            <Copy size={14} /> Copy
          </Button>
          <Button variant="soft" size="1" color="amber">
            <Code2 size={14} /> JSON
          </Button>
          <Button variant="soft" size="1" color="gray">
            <Eraser size={14} /> Clear
          </Button>
          <Button variant="soft" size="1" color="red" onClick={deleteSelectedKey}>
            <Trash2 size={14} /> Delete
          </Button>
        </Flex>

        {selectedKey.type === "string" && (
          <StringKeyEditor
            locales={locales}
            selectedKey={selectedKey}
            onChange={(langCode, newValue) => setStringValue(keyName, langCode, newValue)}
          />
        )}

        {selectedKey.type === "array" && (
          <ArrayKeyEditor
            locales={locales}
            selectedKey={selectedKey}
            onElementChange={(langCode, index, newValue) => setArrayElement(keyName, langCode, index, newValue)}
            onRemoveElement={(index) => removeArrayElement(keyName, index)}
            onAddElement={() => addArrayElement(keyName)}
            onClearEmpty={() => clearEmptyArrayElements(keyName)}
          />
        )}
      </Flex>
    </ScrollArea>
  );
}
