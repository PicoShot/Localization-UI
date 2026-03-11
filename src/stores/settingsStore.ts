import { create } from "zustand";
import { DeeplApiMode } from "../lib/deepl";
import { GeminiModel } from "../lib/gemini";
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

  geminiModel: GeminiModel;
  geminiCustomModel: string;
  geminiApiKey: string;

  accentColor: string;

  loadSettings: () => Promise<void>;
  setDeeplApiMode: (mode: DeeplApiMode) => void;
  setDeeplContext: (context: string) => void;
  setDeeplApiKey: (key: string) => Promise<void>;
  clearDeeplApiKey: () => Promise<void>;
  setGeminiModel: (model: GeminiModel) => void;
  setGeminiCustomModel: (name: string) => void;
  setGeminiApiKey: (key: string) => Promise<void>;
  clearGeminiApiKey: () => Promise<void>;
  setAccentColor: (color: string) => void;
  saveSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  deeplApiMode: "free",
  deeplContext: "",
  deeplApiKey: "",

  geminiModel: "gemini-2.5-flash-lite",
  geminiCustomModel: "",
  geminiApiKey: "",

  accentColor: "indigo",

  loadSettings: async () => {
    try {
      const stored = localStorage.getItem("settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        set({
          deeplApiMode: parsed.deeplApiMode ?? "free",
          deeplContext: parsed.deeplContext ?? "",
          geminiModel: parsed.geminiModel ?? "gemini-2.0-flash",
          geminiCustomModel: parsed.geminiCustomModel ?? "",
          accentColor: parsed.accentColor ?? "indigo",
        });
      }
    } catch (e) {
      console.error("Failed to parse settings from localStorage", e);
    }

    const deeplKey = await loadApiKey(KeyringType.DEEPL);
    if (deeplKey) {
      set({ deeplApiKey: deeplKey });
    }

    const geminiKey = await loadApiKey(KeyringType.GEMINI);
    if (geminiKey) {
      set({ geminiApiKey: geminiKey });
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

  setGeminiModel: (model) => {
    set({ geminiModel: model });
    get().saveSettings();
  },

  setGeminiCustomModel: (name) => {
    set({ geminiCustomModel: name });
    get().saveSettings();
  },

  setGeminiApiKey: async (key: string) => {
    await saveApiKey(KeyringType.GEMINI, key);
    set({ geminiApiKey: key });
  },

  clearGeminiApiKey: async () => {
    await removeApiKey(KeyringType.GEMINI);
    set({ geminiApiKey: "" });
  },

  setAccentColor: (color) => {
    set({ accentColor: color });
    get().saveSettings();
  },

  saveSettings: () => {
    const state = get();
    localStorage.setItem(
      "settings",
      JSON.stringify({
        deeplApiMode: state.deeplApiMode,
        deeplContext: state.deeplContext,
        geminiModel: state.geminiModel,
        geminiCustomModel: state.geminiCustomModel,
        accentColor: state.accentColor,
      }),
    );
  },
}));
