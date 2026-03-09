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

interface KeyDetailsPanelProps {
  data: LocaleData[];
  selectedKey: UnifiedKey | null;
  onDeleteKey: () => void;
  onStringValueChange: (langCode: string, newValue: string) => void;
  onArrayElementChange: (
    langCode: string,
    index: number,
    newValue: string,
  ) => void;
  onRemoveArrayElement: (index: number) => void;
  onAddArrayElement: () => void;
  onClearEmptyArrayElements: () => void;
}

export function KeyDetailsPanel({
  data,
  selectedKey,
  onDeleteKey,
  onStringValueChange,
  onArrayElementChange,
  onRemoveArrayElement,
  onAddArrayElement,
  onClearEmptyArrayElements,
}: KeyDetailsPanelProps) {
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

        {/* Translation Hint */}
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

        {/* Actions Row */}
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
          <Button variant="soft" size="1" color="red" onClick={onDeleteKey}>
            <Trash2 size={14} /> Delete
          </Button>
        </Flex>

        {/* String Key Language Values */}
        {selectedKey.type === "string" && (
          <StringKeyEditor
            data={data}
            selectedKey={selectedKey}
            onChange={onStringValueChange}
          />
        )}

        {/* Array Key Elements */}
        {selectedKey.type === "array" && (
          <ArrayKeyEditor
            data={data}
            selectedKey={selectedKey}
            onElementChange={onArrayElementChange}
            onRemoveElement={onRemoveArrayElement}
            onAddElement={onAddArrayElement}
            onClearEmpty={onClearEmptyArrayElements}
          />
        )}
      </Flex>
    </ScrollArea>
  );
}
