import { memo, useEffect } from "react";
import { Box, Flex, Text, ContextMenu } from "@radix-ui/themes";
import {
  Edit2,
  Trash2,
  Languages,
  Copy,
  ClipboardPaste,
  Eraser,
} from "lucide-react";
import { UnifiedKey } from "@/types/types";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

interface KeyListItemProps {
  item: UnifiedKey;
  isSelected: boolean;
  onSelect: (name: string) => void;
  onDelete: (name: string) => void;
  onRename: (name: string) => void;
  onClearValues: (name: string) => void;
  onPasteName: (name: string) => void;
  onPasteJsonData: (name: string) => void;
  onTranslateDeepL: (name: string) => void;
  onTranslateGemini: (name: string) => void;
  displayName?: string;
  depth?: number;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent, name: string) => void;
  onDragOver?: (e: React.DragEvent, name: string) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent, name: string) => void;
  onDragEnd?: () => void;
  isDragOver?: boolean;
}

export const KeyListItem = memo(function KeyListItem({
  item,
  isSelected,
  onSelect,
  onDelete,
  onRename,
  onClearValues,
  onPasteName,
  onPasteJsonData,
  onTranslateDeepL,
  onTranslateGemini,
  displayName,
  depth = 0,
  isDraggable = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragOver = false,
}: KeyListItemProps) {
  const handleCopyName = () => {
    writeText(item.name);
  };

  const handleCopyJsonData = () => {
    writeText(JSON.stringify(item.values, null, 2));
  };

  useEffect(() => {
    if (!isSelected) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const key = e.key.toLowerCase();

      if (e.key === "F2") {
        e.preventDefault();
        onRename(item.name);
      } else if (e.key === "Delete") {
        e.preventDefault();
        onDelete(item.name);
      } else if (isCtrl && !isShift && key === "c") {
        e.preventDefault();
        handleCopyName();
      } else if (isCtrl && isShift && key === "c") {
        e.preventDefault();
        handleCopyJsonData();
      } else if (isCtrl && !isShift && key === "v") {
        e.preventDefault();
        onPasteName(item.name);
      } else if (isCtrl && isShift && key === "v") {
        e.preventDefault();
        onPasteJsonData(item.name);
      } else if (isCtrl && isShift && key === "d") {
        e.preventDefault();
        onTranslateDeepL(item.name);
      } else if (isCtrl && isShift && key === "g") {
        e.preventDefault();
        onTranslateGemini(item.name);
      } else if (isCtrl && !isShift && key === "e") {
        e.preventDefault();
        onClearValues(item.name);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isSelected,
    item,
    onDelete,
    onRename,
    onClearValues,
    onPasteName,
    onPasteJsonData,
    onTranslateDeepL,
    onTranslateGemini,
  ]);

  const isMac = navigator.userAgent.includes("Mac");
  const mod = isMac ? "⌘" : "Ctrl";

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <Box
          draggable={isDraggable}
          onDragStart={(e) => onDragStart?.(e, item.name)}
          onDragOver={(e) => {
            if (isDraggable) onDragOver?.(e, item.name);
          }}
          onDragLeave={() => {
            if (isDraggable) onDragLeave?.();
          }}
          onDrop={(e) => {
            if (isDraggable) onDrop?.(e, item.name);
          }}
          onDragEnd={() => {
            if (isDraggable) onDragEnd?.();
          }}
          onClick={() => onSelect(item.name)}
          style={{
            padding: "4px 8px",
            paddingLeft: `${8 + depth * 16}px`,
            borderRadius: "6px",
            cursor: isDraggable ? "grab" : "pointer",
            backgroundColor: isDragOver
              ? "var(--indigo-4)"
              : isSelected
                ? "var(--green-4)"
                : "transparent",
            color: isSelected && !isDragOver ? "var(--green-11)" : "inherit",
            transition: "background-color 0.1s ease",
            borderTop: isDragOver ? "2px solid var(--indigo-8)" : "2px solid transparent",
            borderBottom: isDragOver ? "2px solid transparent" : "2px solid transparent", // keeping space
            boxSizing: "border-box",
          }}
          onMouseEnter={(e) => {
            if (!isSelected && !isDragOver) {
              e.currentTarget.style.backgroundColor = "var(--gray-3)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected && !isDragOver) {
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
              {displayName ?? item.name}
            </Text>
          </Flex>
        </Box>
      </ContextMenu.Trigger>

      <ContextMenu.Content>
        <ContextMenu.Item shortcut="F2" onClick={() => onRename(item.name)}>
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
            <ContextMenu.Item
              shortcut={`${mod} + Shift + D`}
              onClick={() => onTranslateDeepL(item.name)}
            >
              DeepL
            </ContextMenu.Item>
            <ContextMenu.Item
              shortcut={`${mod} + Shift + G`}
              onClick={() => onTranslateGemini(item.name)}
            >
              Gemini
            </ContextMenu.Item>
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
            <ContextMenu.Item shortcut={`${mod} + C`} onClick={handleCopyName}>
              Name
            </ContextMenu.Item>
            <ContextMenu.Item
              shortcut={`${mod} + Shift + C`}
              onClick={handleCopyJsonData}
            >
              Json Data
            </ContextMenu.Item>
          </ContextMenu.SubContent>
        </ContextMenu.Sub>

        <ContextMenu.Sub>
          <ContextMenu.SubTrigger>
            <Flex gap="2" align="center">
              <ClipboardPaste size={14} />
              Paste
            </Flex>
          </ContextMenu.SubTrigger>
          <ContextMenu.SubContent>
            <ContextMenu.Item
              shortcut={`${mod} + V`}
              onClick={() => onPasteName(item.name)}
            >
              Name
            </ContextMenu.Item>
            <ContextMenu.Item
              shortcut={`${mod} + Shift + V`}
              onClick={() => onPasteJsonData(item.name)}
            >
              Json Data
            </ContextMenu.Item>
          </ContextMenu.SubContent>
        </ContextMenu.Sub>

        <ContextMenu.Separator />

        <ContextMenu.Item
          shortcut={`${mod} + E`}
          onClick={() => onClearValues(item.name)}
        >
          <Flex gap="2" align="center">
            <Eraser size={14} />
            Clear Values
          </Flex>
        </ContextMenu.Item>

        <ContextMenu.Item
          color="red"
          shortcut="Del"
          onClick={() => onDelete(item.name)}
        >
          <Flex gap="2" align="center">
            <Trash2 size={14} />
            Delete Key
          </Flex>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
});
