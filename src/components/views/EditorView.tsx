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
  const [keys, setKeys] = useState<UnifiedKey[]>([]);
  const [selectedKeyName, setSelectedKeyName] = useState<string | null>(null);

  const [leftWidth, setLeftWidth] = useState(300);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const keyMap = useMemo(() => {
    const map = new Map<string, UnifiedKey>();
    for (const k of keys) {
      map.set(k.name, k);
    }
    return map;
  }, [keys]);

  const selectedKey = useMemo(
    () => (selectedKeyName ? (keyMap.get(selectedKeyName) ?? null) : null),
    [keyMap, selectedKeyName],
  );

  const stableSetSelectedKeyName = useCallback(
    (name: string | null) => setSelectedKeyName(name),
    [],
  );

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
      
      let newWidth = 300;
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        newWidth = Math.max(
          150,
          Math.min(e.clientX - rect.left, rect.width * 0.6)
        );
      } else {
        newWidth = Math.max(
          150,
          Math.min(e.clientX - 60, window.innerWidth * 0.6)
        );
      }
      setLeftWidth(newWidth);
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const handleStringValueChange = useCallback(
    (langCode: string, newValue: string) => {
      setKeys((prev) =>
        prev.map((k) => {
          if (k.name !== selectedKeyName) return k;
          return {
            ...k,
            values: { ...k.values, [langCode]: newValue },
          };
        }),
      );
    },
    [selectedKeyName],
  );

  const handleArrayElementChange = useCallback(
    (langCode: string, index: number, newValue: string) => {
      setKeys((prev) =>
        prev.map((k) => {
          if (k.name !== selectedKeyName) return k;
          const arr = Array.isArray(k.values[langCode])
            ? [...(k.values[langCode] as string[])]
            : [];
          arr[index] = newValue;
          return {
            ...k,
            values: { ...k.values, [langCode]: arr },
          };
        }),
      );
    },
    [selectedKeyName],
  );

  const handleRemoveArrayElement = useCallback(
    (index: number) => {
      setKeys((prev) =>
        prev.map((k) => {
          if (k.name !== selectedKeyName) return k;
          const newVals = { ...k.values };
          data.forEach((loc) => {
            if (Array.isArray(newVals[loc.languageCode])) {
              const arr = [...(newVals[loc.languageCode] as string[])];
              arr.splice(index, 1);
              newVals[loc.languageCode] = arr;
            }
          });
          return { ...k, values: newVals };
        }),
      );
    },
    [selectedKeyName, data],
  );

  const handleAddArrayElement = useCallback(() => {
    setKeys((prev) =>
      prev.map((k) => {
        if (k.name !== selectedKeyName) return k;
        const newVals = { ...k.values };
        data.forEach((loc) => {
          const arr = Array.isArray(newVals[loc.languageCode])
            ? [...(newVals[loc.languageCode] as string[])]
            : [];
          arr.push("");
          newVals[loc.languageCode] = arr;
        });
        return { ...k, values: newVals };
      }),
    );
  }, [selectedKeyName, data]);

  const handleClearEmptyArrayElements = useCallback(() => {}, []);

  const handleDeleteKey = useCallback(() => {
    setKeys((prev) => prev.filter((k) => k.name !== selectedKeyName));
    setSelectedKeyName(null);
  }, [selectedKeyName]);

  return (
    <Card style={{ height: "100%", padding: 0, overflow: "hidden" }}>
      <Flex ref={containerRef} style={{ height: "100%", width: "100%" }}>
        <KeyListSidebar
          width={leftWidth}
          keys={keys}
          setKeys={setKeys}
          selectedKeyName={selectedKeyName}
          setSelectedKeyName={stableSetSelectedKeyName}
        />

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
