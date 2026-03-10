import { useState } from "react";
import { Flex } from "@radix-ui/themes";
import { LeftBar } from "../components/LeftBar";
import { EditorView } from "../components/views/EditorView";
import { SettingsView } from "../components/views/SettingsView";

export function EditorPage() {
  const [activeTab, setActiveTab] = useState<"editor" | "settings">("editor");

  return (
    <Flex gap="5" style={{ height: "100%", width: "100%" }}>
      <LeftBar activeTab={activeTab} setActiveTab={setActiveTab} />

      <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
        {activeTab === "editor" && <EditorView />}
        {activeTab === "settings" && <SettingsView />}
      </Flex>
    </Flex>
  );
}
