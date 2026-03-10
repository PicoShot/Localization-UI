import { Flex } from "@radix-ui/themes";
import { useEditorStore } from "./stores/editorStore";
import { MainPage } from "./pages/MainPage";
import { EditorPage } from "./pages/EditorPage";
import { TitleBar } from "./components/TitleBar";

function App() {
  const isLoaded = useEditorStore((s) => s.keys.length > 0);

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
