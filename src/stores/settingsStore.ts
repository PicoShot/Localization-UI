import { create } from "zustand";
import { DeeplApiMode } from "../lib/deepl";
import { GeminiModel } from "../lib/gemini";
import {
  KeyringType,
  saveApiKey,
  loadApiKey,
  clearApiKey as removeApiKey,
} from "../lib/keyring";
import { hostname } from "@tauri-apps/plugin-os";

interface SettingsState {
  deeplApiMode: DeeplApiMode;
  deeplContext: string;
  deeplApiKey: string;

  geminiModel: GeminiModel;
  geminiCustomModel: string;
  geminiApiKey: string;

  accentColor: string;
  theme: "light" | "dark";

  keyListSearchQuery: string;
  keyListShowStrings: boolean;
  keyListShowArrays: boolean;
  keyListSortByName: boolean;
  keyListGroupByPrefix: boolean;

  sessionUserName: string;
  sessionServerUrl: string;

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
  setTheme: (theme: "light" | "dark") => void;

  setKeyListSearchQuery: (query: string) => void;
  setKeyListShowStrings: (show: boolean) => void;
  setKeyListShowArrays: (show: boolean) => void;
  setKeyListSortByName: (sort: boolean) => void;
  setKeyListGroupByPrefix: (group: boolean) => void;

  setSessionUserName: (name: string) => void;
  setSessionServerUrl: (url: string) => void;

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
  theme: "dark",

  keyListSearchQuery: "",
  keyListShowStrings: true,
  keyListShowArrays: true,
  keyListSortByName: false,
  keyListGroupByPrefix: false,

  sessionUserName: "",
  sessionServerUrl: "wss://live.picoshot.net/ws",

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
          theme: parsed.theme ?? "dark",
          keyListSearchQuery: parsed.keyListSearchQuery ?? "",
          keyListShowStrings: parsed.keyListShowStrings ?? true,
          keyListShowArrays: parsed.keyListShowArrays ?? true,
          keyListSortByName: parsed.keyListSortByName ?? false,
          keyListGroupByPrefix: parsed.keyListGroupByPrefix ?? false,
          sessionUserName: parsed.sessionUserName ?? "",
          sessionServerUrl: "wss://live.picoshot.net/ws",
        });
      }
    } catch (e) {
      console.error("Failed to parse settings from localStorage", e);
    }

    const state = get();
    if (!state.sessionUserName) {
      try {
        const host = await hostname();
        if (host) {
          set({ sessionUserName: host });
          get().saveSettings();
        }
      } catch (e) {
        console.error(e);
      }
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

  setTheme: (theme) => {
    set({ theme });
    get().saveSettings();
  },

  setKeyListSearchQuery: (query) => {
    set({ keyListSearchQuery: query });
    get().saveSettings();
  },

  setKeyListShowStrings: (show) => {
    set({ keyListShowStrings: show });
    get().saveSettings();
  },

  setKeyListShowArrays: (show) => {
    set({ keyListShowArrays: show });
    get().saveSettings();
  },

  setKeyListSortByName: (sort) => {
    set({ keyListSortByName: sort });
    get().saveSettings();
  },

  setKeyListGroupByPrefix: (group) => {
    set({ keyListGroupByPrefix: group });
    get().saveSettings();
  },

  setSessionUserName: (name) => {
    set({ sessionUserName: name });
    get().saveSettings();
  },

  setSessionServerUrl: (url) => {
    set({ sessionServerUrl: url });
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
        theme: state.theme,
        keyListSearchQuery: state.keyListSearchQuery,
        keyListShowStrings: state.keyListShowStrings,
        keyListShowArrays: state.keyListShowArrays,
        keyListSortByName: state.keyListSortByName,
        keyListGroupByPrefix: state.keyListGroupByPrefix,
        sessionUserName: state.sessionUserName,
        sessionServerUrl: state.sessionServerUrl,
      }),
    );
  },
}));
