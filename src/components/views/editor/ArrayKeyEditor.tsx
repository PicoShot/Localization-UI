import {
  Flex,
  Box,
  Text,
  Card,
  IconButton,
  TextField,
  Button,
} from "@radix-ui/themes";
import { X, Plus, Eraser, ChevronDown, ChevronRight, ChevronsUpDown, ChevronsDownUp } from "lucide-react";
import { LocaleData } from "@/lib/bloc";
import { UnifiedKey } from "@/types/types";
import { useState } from "react";
import { RichTextEditorModal } from "./RichTextEditorModal";
import { GetLanguageName } from "@/utils/languages";

interface ArrayKeyEditorProps {
  locales: LocaleData[];
  selectedKey: UnifiedKey;
  onElementChange: (langCode: string, index: number, newValue: string) => void;
  onRemoveElement: (index: number) => void;
  onAddElement: () => void;
  onClearEmpty: () => void;
}

export function ArrayKeyEditor({
  locales,
  selectedKey,
  onElementChange,
  onRemoveElement,
  onAddElement,
  onClearEmpty,
}: ArrayKeyEditorProps) {
  const [editingCell, setEditingCell] = useState<{
    langCode: string;
    index: number;
  } | null>(null);

  const [expandedElements, setExpandedElements] = useState<Set<number>>(new Set());

  let maxLength = 0;
  locales.forEach((loc) => {
    const val = selectedKey.values[loc.languageCode];
    if (Array.isArray(val) && val.length > maxLength) {
      maxLength = val.length;
    }
  });

  const elements = Array.from({ length: maxLength });

  const toggleElement = (index: number) => {
    setExpandedElements((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set(elements.map((_, i) => i));
    setExpandedElements(all);
  };

  const collapseAll = () => {
    setExpandedElements(new Set());
  };

  return (
    <Flex direction="column" gap="5">
      <Flex justify="between" align="center">
        <Text size="3" weight="bold" color="gray">
          Array Elements
        </Text>
        <Flex gap="2">
          <Button size="1" variant="soft" color="gray" onClick={expandAll}>
            <ChevronsUpDown size={14} /> Expand All
          </Button>
          <Button size="1" variant="soft" color="gray" onClick={collapseAll}>
            <ChevronsDownUp size={14} /> Collapse All
          </Button>
        </Flex>
      </Flex>

      {elements.map((_, i) => {
        const isExpanded = expandedElements.has(i);
        return (
        <Card key={i} size="1" variant="surface">
          <Flex direction="column" gap="3">
            <Flex 
              justify="between" 
              align="center"
              onClick={() => toggleElement(i)}
              style={{ cursor: "pointer", userSelect: "none" }}
            >
              <Flex gap="2" align="center">
                {isExpanded ? <ChevronDown size={14} color="var(--gray-11)" /> : <ChevronRight size={14} color="var(--gray-11)" />}
                <Text size="2" weight="bold">
                  Element {i}
                </Text>
              </Flex>
              <IconButton
                size="1"
                variant="ghost"
                color="red"
                onClick={(e) => { e.stopPropagation(); onRemoveElement(i); }}
              >
                <X size={14} />
              </IconButton>
            </Flex>

            {isExpanded && locales.map((locale) => {
              const valArr = selectedKey.values[locale.languageCode] as
                | string[]
                | undefined;
              const val = valArr ? valArr[i] : "";
              return (
                <Box key={locale.languageCode}>
                  <Text
                    as="label"
                    size="1"
                    color="gray"
                    style={{ display: "block", marginBottom: "4px" }}
                  >
                    {GetLanguageName(locale.languageCode)}:
                  </Text>
                  <TextField.Root
                    value={val || ""}
                    onChange={(e) =>
                      onElementChange(locale.languageCode, i, e.target.value)
                    }
                    onDoubleClick={() =>
                      setEditingCell({
                        langCode: locale.languageCode,
                        index: i,
                      })
                    }
                    placeholder={`Element ${i} in ${GetLanguageName(locale.languageCode)}`}
                    style={{ cursor: "text" }}
                  />
                </Box>
              );
            })}
          </Flex>
        </Card>
      )})}

      <Flex gap="2">
        <Button variant="soft" onClick={() => {
          onAddElement();
          setExpandedElements((prev) => {
            const next = new Set(prev);
            next.add(maxLength);
            return next;
          });
        }}>
          <Plus size={16} /> Add New Element
        </Button>
        <Button variant="soft" color="gray" onClick={onClearEmpty}>
          <Eraser size={16} /> Clear Empty
        </Button>
      </Flex>

      <RichTextEditorModal
        open={editingCell !== null}
        onOpenChange={(open) => {
          if (!open) setEditingCell(null);
        }}
        initialValue={
          editingCell
            ? (
                selectedKey.values[editingCell.langCode] as string[] | undefined
              )?.[editingCell.index] || ""
            : ""
        }
        onSave={(val) => {
          if (editingCell) {
            onElementChange(editingCell.langCode, editingCell.index, val);
          }
        }}
        title={
          editingCell
            ? `Edit Element ${editingCell.index} - ${editingCell.langCode.toUpperCase()}`
            : "Edit Text"
        }
      />
    </Flex>
  );
}
