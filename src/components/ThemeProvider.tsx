import React, { createContext, useContext, useEffect } from "react";
import { Theme } from "@radix-ui/themes";
import { useSettingsStore } from "../stores/settingsStore";
import {
  //getCurrentWindow,
  type Theme as TauriTheme,
} from "@tauri-apps/api/window";

interface ThemeContextType {
  theme: TauriTheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

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
      <Theme appearance={theme} accentColor={store.accentColor as any} grayColor="slate">
        {children}
      </Theme>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
