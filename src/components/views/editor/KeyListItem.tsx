import { Box, Flex, Text } from "@radix-ui/themes";
import { UnifiedKey } from "./types";

interface KeyListItemProps {
  item: UnifiedKey;
  isSelected: boolean;
  onSelect: (name: string) => void;
}

export function KeyListItem({ item, isSelected, onSelect }: KeyListItemProps) {
  return (
    <Box
      onClick={() => onSelect(item.name)}
      className="group"
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
      onContextMenu={(e) => {
        e.preventDefault();
        onSelect(item.name);
        // Custom right-click context menu logic can go here later
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
  );
}
