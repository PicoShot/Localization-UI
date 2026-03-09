import { Flex, Text } from "@radix-ui/themes";
import {
  Cross1Icon,
  MinusIcon,
  SquareIcon,
  SunIcon,
  MoonIcon,
} from "@radix-ui/react-icons";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useTheme } from "./ThemeProvider";

export function TitleBar() {
  const { theme, toggleTheme } = useTheme();
  const appWindow = getCurrentWindow();

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
