import React, { createContext, useContext, useState, useEffect } from "react";
import { Theme } from "@radix-ui/themes";
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
  const [theme, setTheme] = useState<TauriTheme>("dark");

  //const systemTheme = await getCurrentWindow().theme();

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    document.documentElement.className =
      theme === "dark" ? "dark dark-theme" : "light light-theme";
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <Theme appearance={theme} accentColor="indigo" grayColor="slate">
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
