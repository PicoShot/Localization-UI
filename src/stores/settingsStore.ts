import { create } from "zustand";
import { DeeplApiMode } from "../lib/deepl";
import {
  KeyringType,
  saveApiKey,
  loadApiKey,
  clearApiKey as removeApiKey,
} from "../lib/keyring";

interface SettingsState {
  deeplApiMode: DeeplApiMode;
  deeplContext: string;
  deeplApiKey: string;

  loadSettings: () => Promise<void>;
  setDeeplApiMode: (mode: DeeplApiMode) => void;
  setDeeplContext: (context: string) => void;
  setDeeplApiKey: (key: string) => Promise<void>;
  clearDeeplApiKey: () => Promise<void>;
  saveSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  deeplApiMode: "free",
  deeplContext: "",
  deeplApiKey: "",

  loadSettings: async () => {
    try {
      const stored = localStorage.getItem("settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        set({
          deeplApiMode: parsed.deeplApiMode ?? "free",
          deeplContext: parsed.deeplContext ?? "",
        });
      }
    } catch (e) {
      console.error("Failed to parse settings from localStorage", e);
    }

    const key = await loadApiKey(KeyringType.DEEPL);
    if (key) {
      set({ deeplApiKey: key });
    }
  },

  setDeeplApiMode: (mode) => {
    set({ deeplApiMode: mode });
    get().saveSettings();
  },

  setDeeplContext: (context) => {
    set({ deeplContext: context });
    get().saveSettings();
  },

  setDeeplApiKey: async (key: string) => {
    await saveApiKey(KeyringType.DEEPL, key);
    set({ deeplApiKey: key });
  },

  clearDeeplApiKey: async () => {
    await removeApiKey(KeyringType.DEEPL);
    set({ deeplApiKey: "" });
  },

  saveSettings: () => {
    const state = get();
    localStorage.setItem(
      "settings",
      JSON.stringify({
        deeplApiMode: state.deeplApiMode,
        deeplContext: state.deeplContext,
      }),
    );
  },
}));
