import { memo } from "react";
import { Box, Flex, Text, ContextMenu } from "@radix-ui/themes";
import { Edit2, Trash2, Languages, Copy, Code2, Eraser } from "lucide-react";
import { UnifiedKey } from "./types";

interface KeyListItemProps {
  item: UnifiedKey;
  isSelected: boolean;
  onSelect: (name: string) => void;
}

export const KeyListItem = memo(function KeyListItem({
  item,
  isSelected,
  onSelect,
}: KeyListItemProps) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <Box
          onClick={() => onSelect(item.name)}
          style={{
            padding: "4px 8px",
            borderRadius: "6px",
            cursor: "pointer",
            backgroundColor: isSelected ? "var(--green-4)" : "transparent",
            color: isSelected ? "var(--green-11)" : "inherit",
            transition: "background-color 0.1s ease",
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = "var(--gray-3)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = "transparent";
            }
          }}
        >
          <Flex gap="2" align="center">
            <Text
              size="1"
              color={isSelected ? "green" : "gray"}
              weight="bold"
              style={{ fontFamily: "monospace", width: "20px" }}
            >
              {item.type === "string" ? "Aa" : "[]"}
            </Text>
            <Text
              size="2"
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.name}
            </Text>
          </Flex>
        </Box>
      </ContextMenu.Trigger>

      <ContextMenu.Content>
        <ContextMenu.Item>
          <Flex gap="2" align="center">
            <Edit2 size={14} />
            Rename
          </Flex>
        </ContextMenu.Item>

        <ContextMenu.Sub>
          <ContextMenu.SubTrigger>
            <Flex gap="2" align="center">
              <Languages size={14} />
              Translate
            </Flex>
          </ContextMenu.SubTrigger>
          <ContextMenu.SubContent>
            <ContextMenu.Item>All Languages</ContextMenu.Item>
            <ContextMenu.Item>Missing Only</ContextMenu.Item>
          </ContextMenu.SubContent>
        </ContextMenu.Sub>

        <ContextMenu.Sub>
          <ContextMenu.SubTrigger>
            <Flex gap="2" align="center">
              <Copy size={14} />
              Copy
            </Flex>
          </ContextMenu.SubTrigger>
          <ContextMenu.SubContent>
            <ContextMenu.Item>Name</ContextMenu.Item>
            <ContextMenu.Item>As Json</ContextMenu.Item>
          </ContextMenu.SubContent>
        </ContextMenu.Sub>

        <ContextMenu.Item>
          <Flex gap="2" align="center">
            <Code2 size={14} />
            Copy as JSON
          </Flex>
        </ContextMenu.Item>

        <ContextMenu.Separator />

        <ContextMenu.Item>
          <Flex gap="2" align="center">
            <Eraser size={14} />
            Clear Values
          </Flex>
        </ContextMenu.Item>

        <ContextMenu.Item color="red">
          <Flex gap="2" align="center">
            <Trash2 size={14} />
            Delete Key
          </Flex>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
});

