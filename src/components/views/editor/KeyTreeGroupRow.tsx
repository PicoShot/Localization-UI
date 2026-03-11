import { memo } from "react";
import { Box, Flex, Text, ContextMenu } from "@radix-ui/themes";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Eraser,
  Trash2,
} from "lucide-react";
import type { KeyTreeGroup } from "@/utils/keyTree";

interface KeyTreeGroupRowProps {
  node: KeyTreeGroup;
  depth: number;
  isExpanded: boolean;
  onToggle: (fullPath: string) => void;
  onAddKey: (prefix: string) => void;
  onRenameGroup: (prefix: string) => void;
  onClearGroup: (prefix: string) => void;
  onDeleteGroup: (prefix: string) => void;
}

export const KeyTreeGroupRow = memo(function KeyTreeGroupRow({
  node,
  depth,
  isExpanded,
  onToggle,
  onAddKey,
  onRenameGroup,
  onClearGroup,
  onDeleteGroup,
}: KeyTreeGroupRowProps) {
  const Chevron = isExpanded ? ChevronDown : ChevronRight;

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <Box
          onClick={() => onToggle(node.fullPath)}
          style={{
            padding: "4px 8px",
            paddingLeft: `${8 + depth * 16}px`,
            borderRadius: "6px",
            cursor: "pointer",
            transition: "background-color 0.1s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--gray-3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <Flex gap="2" align="center">
            <Chevron size={14} style={{ flexShrink: 0 }} />
            <Text size="2" weight="medium" style={{ flex: 1 }}>
              {node.label}
            </Text>
            <Text size="1" color="gray">
              {node.totalCount}
            </Text>
          </Flex>
        </Box>
      </ContextMenu.Trigger>

      <ContextMenu.Content>
        <ContextMenu.Item onClick={() => onAddKey(node.fullPath)}>
          <Flex gap="2" align="center">
            <Plus size={14} />
            Add Key Here
          </Flex>
        </ContextMenu.Item>
        <ContextMenu.Item onClick={() => onRenameGroup(node.fullPath)}>
          <Flex gap="2" align="center">
            <Edit2 size={14} />
            Rename Group
          </Flex>
        </ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item onClick={() => onClearGroup(node.fullPath)}>
          <Flex gap="2" align="center">
            <Eraser size={14} />
            Clear Group Values
          </Flex>
        </ContextMenu.Item>
        <ContextMenu.Item
          color="red"
          onClick={() => onDeleteGroup(node.fullPath)}
        >
          <Flex gap="2" align="center">
            <Trash2 size={14} />
            Delete Group
          </Flex>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
});
