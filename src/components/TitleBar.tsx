import { Flex, Text } from "@radix-ui/themes";
import {
  Cross1Icon,
  MinusIcon,
  SquareIcon,
  SunIcon,
  MoonIcon,
} from "@radix-ui/react-icons";
import { Save } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useTheme } from "./ThemeProvider";
import { useEditorStore } from "@/stores/editorStore";

export function TitleBar() {
  const { theme, toggleTheme } = useTheme();
  const appWindow = getCurrentWindow();

  const hasUnsavedChanges = useEditorStore((s) => s.hasUnsavedChanges);
  const saveFiles = useEditorStore((s) => s.saveFiles);
  const filePaths = useEditorStore((s) => s.filePaths);
  const keysCount = useEditorStore((s) => s.keys.length);

  const isLoaded = keysCount > 0;
  const canSave = filePaths.size > 0;

  return (
    <Flex
      align="center"
      justify="between"
      style={{
        height: "36px",
        background: "var(--color-panel)",
        userSelect: "none",
        borderBottom: "1px solid var(--gray-a4)",
      }}
      data-tauri-drag-region
    >
      <Flex
        data-tauri-drag-region
        align="center"
        px="3"
        gap="2"
        style={{ flex: 1, height: "100%" }}
      >
        <Text
          size="2"
          weight="medium"
          color="gray"
          style={{ pointerEvents: "none" }}
        >
          Localization Editor
        </Text>
      </Flex>

      <Flex align="center" style={{ height: "100%" }}>
        {isLoaded && (
          <div
            onClick={canSave && hasUnsavedChanges ? saveFiles : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              paddingLeft: "10px",
              paddingRight: "10px",
              height: "100%",
              cursor: canSave && hasUnsavedChanges ? "pointer" : "default",
              opacity: canSave ? 1 : 0.4,
              color: hasUnsavedChanges ? "var(--indigo-11)" : "var(--gray-9)",
              fontWeight: hasUnsavedChanges ? 600 : 400,
              fontSize: "12px",
            }}
            className={
              canSave && hasUnsavedChanges
                ? "hover:bg-[var(--indigo-a3)] transition-colors"
                : "transition-colors"
            }
          >
            <Save size={14} />
            <span>{hasUnsavedChanges ? "Save" : "Saved"}</span>
          </div>
        )}

        <div
          onClick={toggleTheme}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "45px",
            height: "100%",
            cursor: "pointer",
          }}
          className="hover:bg-[var(--gray-a3)] transition-colors"
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </div>

        <div
          onClick={() => appWindow.minimize()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "45px",
            height: "100%",
            cursor: "pointer",
          }}
          className="hover:bg-[var(--gray-a3)] transition-colors"
        >
          <MinusIcon />
        </div>

        <div
          onClick={() => appWindow.toggleMaximize()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "45px",
            height: "100%",
            cursor: "pointer",
          }}
          className="hover:bg-[var(--gray-a3)] transition-colors"
        >
          <SquareIcon width="12" height="12" />
        </div>

        <div
          onClick={() => appWindow.close()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "45px",
            height: "100%",
            cursor: "pointer",
          }}
          className="hover:bg-[#e81123] hover:text-white transition-colors"
        >
          <Cross1Icon />
        </div>
      </Flex>
    </Flex>
  );
}
