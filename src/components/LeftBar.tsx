import { useState } from "react";
import {
  Flex,
  Button,
  Box,
  Text,
  IconButton,
  Tooltip,
} from "@radix-ui/themes";
import {
  GearIcon,
  Pencil1Icon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
  ExitIcon,
} from "@radix-ui/react-icons";

interface LeftBarProps {
  activeTab: "editor" | "settings";
  setActiveTab: (tab: "editor" | "settings") => void;
  onBack: () => void;
}

export function LeftBar({ activeTab, setActiveTab, onBack }: LeftBarProps) {
  const [isCompact, setIsCompact] = useState(true);

  const renderWithTooltip = (content: string, children: React.ReactElement) => {
    return isCompact ? (
      <Tooltip content={content} side="right">
        {children}
      </Tooltip>
    ) : (
      children
    );
  };

  return (
    <Flex
      direction="column"
      gap="2"
      style={{
        width: isCompact ? "64px" : "220px",
        borderRight: "1px solid var(--gray-a5)",
        transition: "width 0.2s ease-in-out",
        overflow: "hidden",
      }}
    >
      <Flex
        align="center"
        justify={"between"}
        mb="2"
        style={{ paddingLeft: "var(--space-4)", paddingTop: "var(--space-4)" }}
      >
        <IconButton
          variant="ghost"
          color="gray"
          onClick={() => setIsCompact(!isCompact)}
          style={{ cursor: "pointer", flexShrink: 0 }}
        >
          {isCompact ? <DoubleArrowRightIcon /> : <DoubleArrowLeftIcon />}
        </IconButton>
      </Flex>

      <Flex
        direction="column"
        gap="2"
        style={{ paddingRight: "var(--space-4)" }}
      >
        {renderWithTooltip(
          "Editor",
          <Button
            size="3"
            variant="outline"
            color={activeTab === "editor" ? "indigo" : "gray"}
            style={{
              justifyContent: isCompact ? "center" : "flex-start",
              cursor: "pointer",
              width: "100%",
              padding: isCompact ? 0 : undefined,
            }}
            onClick={() => setActiveTab("editor")}
          >
            <Pencil1Icon />
            {!isCompact && <Text size="3">Editor</Text>}
          </Button>,
        )}

        {renderWithTooltip(
          "Settings",
          <Button
            size="3"
            variant="outline"
            color={activeTab === "settings" ? "indigo" : "gray"}
            style={{
              justifyContent: isCompact ? "center" : "flex-start",
              cursor: "pointer",
              width: "100%",
              padding: isCompact ? 0 : undefined,
            }}
            onClick={() => setActiveTab("settings")}
          >
            <GearIcon />
            {!isCompact && <Text size="3">Settings</Text>}
          </Button>,
        )}
      </Flex>

      <Box style={{ flex: 1 }} />

      <Flex direction="column" style={{ paddingRight: "var(--space-4)" }}>
        {renderWithTooltip(
          "Close Files",
          <Button
            variant="outline"
            color="red"
            size="3"
            onClick={onBack}
            style={{
              justifyContent: isCompact ? "center" : "flex-start",
              cursor: "pointer",
              width: "100%",
              padding: isCompact ? 0 : undefined,
            }}
          >
            {isCompact ? <ExitIcon /> : "Close Files"}
          </Button>,
        )}
      </Flex>
    </Flex>
  );
}
