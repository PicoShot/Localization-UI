import React, { useEffect } from "react";
import { Theme } from "@radix-ui/themes";
import { useSettingsStore } from "../stores/settingsStore";
import { ThemeContext } from "../hooks/useTheme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const store = useSettingsStore();
  const theme = store.theme;

  const toggleTheme = () => {
    store.setTheme(theme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    document.documentElement.className =
      theme === "dark" ? "dark dark-theme" : "light light-theme";
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <Theme
        appearance={theme}
        accentColor={store.accentColor as never}
        grayColor="slate"
      >
        {children}
      </Theme>
    </ThemeContext.Provider>
  );
}
