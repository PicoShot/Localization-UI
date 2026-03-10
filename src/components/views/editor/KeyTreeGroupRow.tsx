import { memo } from "react";
import { Box, Flex, Text } from "@radix-ui/themes";
import { ChevronRight, ChevronDown } from "lucide-react";
import type { KeyTreeGroup } from "@/utils/keyTree";

interface KeyTreeGroupRowProps {
  node: KeyTreeGroup;
  depth: number;
  isExpanded: boolean;
  onToggle: (fullPath: string) => void;
}

export const KeyTreeGroupRow = memo(function KeyTreeGroupRow({
  node,
  depth,
  isExpanded,
  onToggle,
}: KeyTreeGroupRowProps) {
  const Chevron = isExpanded ? ChevronDown : ChevronRight;

  return (
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
  );
});
