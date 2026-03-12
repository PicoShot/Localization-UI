import { useState } from "react";
import { Flex, Button, Box, Text, IconButton, Tooltip } from "@radix-ui/themes";
import {
  GearIcon,
  Pencil1Icon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
  ExitIcon,
  DownloadIcon,
} from "@radix-ui/react-icons";
import { Users } from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useUpdateStore } from "@/stores/updateStore";

interface LeftBarProps {
  activeTab: "editor" | "settings" | "sessions";
  setActiveTab: (tab: "editor" | "settings" | "sessions") => void;
}

export function LeftBar({ activeTab, setActiveTab }: LeftBarProps) {
  const closeFiles = useEditorStore((s) => s.closeFiles);
  const store = useSettingsStore();
  const connected = useSessionStore((s) => s.connected);
  const { updateAvailable, updateDetails, isUpdating, installUpdate } =
    useUpdateStore();
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
            color={
              activeTab === "editor" ? (store.accentColor as never) : "gray"
            }
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
          "Sessions",
          <Button
            size="3"
            variant="outline"
            color={
              activeTab === "sessions" ? (store.accentColor as never) : "gray"
            }
            style={{
              justifyContent: isCompact ? "center" : "flex-start",
              cursor: "pointer",
              width: "100%",
              padding: isCompact ? 0 : undefined,
              position: "relative",
            }}
            onClick={() => setActiveTab("sessions")}
          >
            <Box style={{ position: "relative", display: "inline-flex" }}>
              <Users size={15} />
              {connected && (
                <Box
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "var(--green-9)",
                  }}
                />
              )}
            </Box>
            {!isCompact && <Text size="3">Sessions</Text>}
          </Button>,
        )}

        {renderWithTooltip(
          "Settings",
          <Button
            size="3"
            variant="outline"
            color={
              activeTab === "settings" ? (store.accentColor as never) : "gray"
            }
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

      <Flex
        direction="column"
        gap="2"
        style={{ paddingRight: "var(--space-4)" }}
      >
        {updateAvailable &&
          renderWithTooltip(
            `Update to v${updateDetails?.version || "new"}`,
            <Button
              variant="solid"
              color="green"
              size="3"
              onClick={installUpdate}
              disabled={isUpdating}
              style={{
                justifyContent: isCompact ? "center" : "flex-start",
                cursor: "pointer",
                width: "100%",
                padding: isCompact ? 0 : undefined,
              }}
            >
              <DownloadIcon />
              {!isCompact && (
                <Text size="3">
                  {isUpdating ? "Updating..." : "Update App"}
                </Text>
              )}
            </Button>,
          )}

        {renderWithTooltip(
          "Close Files",
          <Button
            variant="outline"
            color="red"
            size="3"
            onClick={closeFiles}
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
