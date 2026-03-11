import { createContext, useContext } from "react";
import { type Theme as TauriTheme } from "@tauri-apps/api/window";

export interface ThemeContextType {
  theme: TauriTheme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
