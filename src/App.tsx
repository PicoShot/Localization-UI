import { useState } from "react";
import { Flex } from "@radix-ui/themes";
import { LocaleData } from "./lib/bloc";
import { MainPage } from "./pages/MainPage";
import { EditorPage } from "./pages/EditorPage";
import { TitleBar } from "./components/TitleBar";

function App() {
  const [parsedDataList, setParsedDataList] = useState<LocaleData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleParsed = (data: LocaleData[]) => {
    setError(null);
    setParsedDataList(data);
  };

  const handleError = (err: string) => {
    setParsedDataList([]);
    setError(err);
  };

  const handleBack = () => {
    setParsedDataList([]);
    setError(null);
  };

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
        {parsedDataList.length === 0 ? (
          <MainPage
            onParsed={handleParsed}
            onError={handleError}
            error={error}
          />
        ) : (
          <EditorPage data={parsedDataList} onBack={handleBack} />
        )}
      </Flex>
    </Flex>
  );
}

export default App;
