import { useState } from "react";
import { Flex } from "@radix-ui/themes";
import { LocaleData } from "../lib/bloc";
import { LeftBar } from "../components/LeftBar";
import { EditorView } from "../components/views/EditorView";
import { SettingsView } from "../components/views/SettingsView";

interface EditorPageProps {
  data: LocaleData[];
  onBack: () => void;
}

export function EditorPage({ data, onBack }: EditorPageProps) {
  const [activeTab, setActiveTab] = useState<"editor" | "settings">("editor");

  return (
    <Flex gap="5" style={{ height: "100%", width: "100%" }}>
      {/* Sidebar */}
      <LeftBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onBack={onBack}
      />

      {/* Main Content Area */}
      <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
        {activeTab === "editor" && <EditorView data={data} />}
        {activeTab === "settings" && <SettingsView />}
      </Flex>
    </Flex>
  );
}
