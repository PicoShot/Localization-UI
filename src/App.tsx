import { useEffect } from "react";
import { Flex } from "@radix-ui/themes";
import { useEditorStore } from "@/stores/editorStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { MainPage } from "@/pages/MainPage";
import { EditorPage } from "@/pages/EditorPage";
import { TitleBar } from "@/components/TitleBar";
import { getCurrentWindow } from "@tauri-apps/api/window";

function App() {
  const isLoaded = useEditorStore((s) => s.locales.length > 0);

  useEffect(() => {
    useSettingsStore.getState().loadSettings();
    useEditorStore.getState().restoreSession();
    getCurrentWindow().show();
  }, []);

  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  return (
    <Flex
      direction="column"
      style={{
        height: "100vh",
        backgroundColor: "var(--color-page-background)",
      }}
    >
      <TitleBar />
      <Flex direction="column" p="4" style={{ flex: 1, minHeight: 0 }}>
        {isLoaded ? <EditorPage /> : <MainPage />}
      </Flex>
    </Flex>
  );
}

export default App;
