import { Flex, Heading, Button, Box, Text } from "@radix-ui/themes";
import { GearIcon, Pencil1Icon } from "@radix-ui/react-icons";

interface LeftBarProps {
  activeTab: "editor" | "settings";
  setActiveTab: (tab: "editor" | "settings") => void;
  onBack: () => void;
}

export function LeftBar({ activeTab, setActiveTab, onBack }: LeftBarProps) {
  return (
    <Flex
      direction="column"
      gap="2"
      style={{
        width: "220px",
        borderRight: "1px solid var(--gray-a5)",
        paddingRight: "var(--space-4)",
      }}
    >
      <Flex align="center" justify="between" mb="2">
        <Heading size="5">Menu</Heading>
      </Flex>

      <Button
        size="3"
        variant="outline"
        color={activeTab === "editor" ? "indigo" : "gray"}
        style={{ justifyContent: "flex-start", cursor: "pointer" }}
        onClick={() => setActiveTab("editor")}
      >
        <Pencil1Icon />
        <Text size="3">Editor</Text>
      </Button>

      <Button
        size="3"
        variant="outline"
        color={activeTab === "settings" ? "indigo" : "gray"}
        style={{ justifyContent: "flex-start", cursor: "pointer" }}
        onClick={() => setActiveTab("settings")}
      >
        <GearIcon />
        <Text size="3">Settings</Text>
      </Button>

      <Box style={{ flex: 1 }} />

      <Button
        variant="outline"
        color="red"
        size="3"
        onClick={onBack}
        style={{ cursor: "pointer" }}
      >
        Close Files
      </Button>
    </Flex>
  );
}
