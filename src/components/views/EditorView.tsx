import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Flex, Card } from "@radix-ui/themes";
import { useEditorStore } from "@/stores/editorStore";
import { UnifiedKey } from "@/types/types";
import { KeyListSidebar } from "./editor/KeyListSidebar";
import { KeyDetailsPanel } from "./editor/KeyDetailsPanel";

export function EditorView() {
  const keys = useEditorStore((s) => s.keys);
  const selectedKeyName = useEditorStore((s) => s.selectedKeyName);
  const setSelectedKeyName = useEditorStore((s) => s.setSelectedKeyName);
  const locales = useEditorStore((s) => s.locales);

  const [leftWidth, setLeftWidth] = useState(300);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

      let newWidth: number;
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        newWidth = Math.max(
          150,
          Math.min(e.clientX - rect.left, rect.width * 0.6),
        );
      } else {
        newWidth = Math.max(
          150,
          Math.min(e.clientX - 60, window.innerWidth * 0.6),
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

  return (
    <Card style={{ height: "100%", padding: 0, overflow: "hidden" }}>
      <Flex ref={containerRef} style={{ height: "100%", width: "100%" }}>
        <KeyListSidebar
          width={leftWidth}
          keys={keys}
          selectedKeyName={selectedKeyName}
          setSelectedKeyName={setSelectedKeyName}
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
          <KeyDetailsPanel locales={locales} selectedKey={selectedKey} />
        </Flex>
      </Flex>
    </Card>
  );
}
