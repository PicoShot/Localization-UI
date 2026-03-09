import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Flex, Card } from "@radix-ui/themes";
import { LocaleData } from "../../lib/bloc";
import { UnifiedKey } from "./editor/types";
import { KeyListSidebar } from "./editor/KeyListSidebar";
import { KeyDetailsPanel } from "./editor/KeyDetailsPanel";

interface EditorViewProps {
  data: LocaleData[];
}

export function EditorView({ data }: EditorViewProps) {
  // We'll manage local edits of keys based on initial data
  const [keys, setKeys] = useState<UnifiedKey[]>([]);
  const [selectedKeyName, setSelectedKeyName] = useState<string | null>(null);

  // Resizable sidebar state
  const [leftWidth, setLeftWidth] = useState(300);
  const isDragging = useRef(false);

  // Extract all unique keys from provided Locales on mount
  useEffect(() => {
    const keyMap = new Map<string, UnifiedKey>();

    data.forEach((locale) => {
      Object.entries(locale.translations).forEach(([key, value]) => {
        if (!keyMap.has(key)) {
          keyMap.set(key, {
            name: key,
            type: Array.isArray(value) ? "array" : "string",
            values: {},
          });
        }
        keyMap.get(key)!.values[locale.languageCode] = value;
      });
    });

    setKeys(Array.from(keyMap.values()));
  }, [data]);

  // Selected key data
  const selectedKey = useMemo(
    () => keys.find((k) => k.name === selectedKeyName) || null,
    [keys, selectedKeyName]
  );

  // Drag resizer handlers
  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
  }, []);

  useEffect(() => {
    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "default";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newWidth = Math.max(
        150,
        Math.min(e.clientX - 60, window.innerWidth * 0.5)
      ); // -60 roughly accounts for app sidebar
      setLeftWidth(newWidth);
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Update handlers (for local state simulation)
  const handleStringValueChange = (langCode: string, newValue: string) => {
    if (!selectedKey) return;
    setKeys((prev) =>
      prev.map((k) => {
        if (k.name === selectedKey.name) {
          return {
            ...k,
            values: { ...k.values, [langCode]: newValue },
          };
        }
        return k;
      })
    );
  };

  const handleArrayElementChange = (
    langCode: string,
    index: number,
    newValue: string
  ) => {
    if (!selectedKey || selectedKey.type !== "array") return;
    setKeys((prev) =>
      prev.map((k) => {
        if (k.name === selectedKey.name) {
          const arr = Array.isArray(k.values[langCode])
            ? [...(k.values[langCode] as string[])]
            : [];
          arr[index] = newValue;
          return {
            ...k,
            values: { ...k.values, [langCode]: arr },
          };
        }
        return k;
      })
    );
  };

  const handleRemoveArrayElement = (index: number) => {
    if (!selectedKey) return;
    setKeys((prev) =>
      prev.map((k) => {
        if (k.name !== selectedKey.name) return k;
        const newVals = { ...k.values };
        data.forEach((loc) => {
          if (Array.isArray(newVals[loc.languageCode])) {
            const arr = [...(newVals[loc.languageCode] as string[])];
            arr.splice(index, 1);
            newVals[loc.languageCode] = arr;
          }
        });
        return { ...k, values: newVals };
      })
    );
  };

  const handleAddArrayElement = () => {
    if (!selectedKey) return;
    setKeys((prev) =>
      prev.map((k) => {
        if (k.name !== selectedKey.name) return k;
        const newVals = { ...k.values };
        data.forEach((loc) => {
          const arr = Array.isArray(newVals[loc.languageCode])
            ? [...(newVals[loc.languageCode] as string[])]
            : [];
          arr.push("");
          newVals[loc.languageCode] = arr;
        });
        return { ...k, values: newVals };
      })
    );
  };

  const handleClearEmptyArrayElements = () => {
    // Basic implementation outline
  };

  const handleDeleteKey = () => {
    if (!selectedKey) return;
    setKeys(keys.filter((k) => k.name !== selectedKey.name));
    setSelectedKeyName(null);
  };

  return (
    <Card style={{ height: "100%", padding: 0, overflow: "hidden" }}>
      <Flex style={{ height: "100%", width: "100%" }}>
        {/* LEFT PANEL */}
        <KeyListSidebar
          width={leftWidth}
          keys={keys}
          setKeys={setKeys}
          selectedKeyName={selectedKeyName}
          setSelectedKeyName={setSelectedKeyName}
        />

        {/* RESIZER DRAG HANDLE */}
        <div
          style={{
            width: "4px",
            backgroundColor: "transparent",
            cursor: "col-resize",
            zIndex: 10,
            transition: "background-color 0.2s",
          }}
          onMouseDown={handleMouseDown}
          onMouseEnter={(e) => {
            if (!isDragging.current) {
              e.currentTarget.style.backgroundColor = "var(--accent-a7)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isDragging.current) {
              e.currentTarget.style.backgroundColor = "transparent";
            }
          }}
        />

        {/* RIGHT PANEL - KEY DETAILS */}
        <Flex
          direction="column"
          style={{
            flex: 1,
            backgroundColor: "var(--color-panel-solid)",
            overflow: "hidden",
          }}
        >
          <KeyDetailsPanel
            data={data}
            selectedKey={selectedKey}
            onDeleteKey={handleDeleteKey}
            onStringValueChange={handleStringValueChange}
            onArrayElementChange={handleArrayElementChange}
            onRemoveArrayElement={handleRemoveArrayElement}
            onAddArrayElement={handleAddArrayElement}
            onClearEmptyArrayElements={handleClearEmptyArrayElements}
          />
        </Flex>
      </Flex>
    </Card>
  );
}

