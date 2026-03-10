import { create } from "zustand";
import { LocaleBlocSerializer, LocaleData } from "../lib/bloc";
import { UnifiedKey } from "../lib/types";
import { writeFile } from "@tauri-apps/plugin-fs";

interface EditorState {
  locales: LocaleData[];
  keys: UnifiedKey[];
  filePaths: Map<string, string>;
  selectedKeyName: string | null;
  hasUnsavedChanges: boolean;
  loadError: string | null;

  loadFiles: (data: LocaleData[], filePaths: Map<string, string>) => void;
  closeFiles: () => void;
  setLoadError: (error: string | null) => void;
  setSelectedKeyName: (name: string | null) => void;
  addKey: (key: UnifiedKey) => void;
  deleteSelectedKey: () => void;
  setStringValue: (keyName: string, langCode: string, value: string) => void;
  setArrayElement: (keyName: string, langCode: string, index: number, value: string) => void;
  removeArrayElement: (keyName: string, index: number) => void;
  addArrayElement: (keyName: string) => void;
  clearEmptyArrayElements: (keyName: string) => void;
  saveFiles: () => Promise<void>;
}

function buildKeysFromLocales(data: LocaleData[]): UnifiedKey[] {
  const keyMap = new Map<string, UnifiedKey>();

  for (const locale of data) {
    for (const [key, value] of Object.entries(locale.translations)) {
      if (!keyMap.has(key)) {
        keyMap.set(key, {
          name: key,
          type: Array.isArray(value) ? "array" : "string",
          values: {},
        });
      }
      keyMap.get(key)!.values[locale.languageCode] = value;
    }
  }

  return Array.from(keyMap.values());
}

function updateKey(keys: UnifiedKey[], keyName: string, updater: (key: UnifiedKey) => UnifiedKey): UnifiedKey[] {
  return keys.map((k) => {
    if (k.name !== keyName) return k;
    return updater(k);
  });
}

function keysToLocaleData(keys: UnifiedKey[], locales: LocaleData[]): LocaleData[] {
  return locales.map((locale) => {
    const translations: Record<string, string | string[] | null | undefined> = {};
    for (const key of keys) {
      const value = key.values[locale.languageCode];
      if (value !== undefined) {
        translations[key.name] = value;
      }
    }
    return {
      version: locale.version,
      languageCode: locale.languageCode,
      translations,
    };
  });
}

export const useEditorStore = create<EditorState>()((set, get) => ({
  locales: [],
  keys: [],
  filePaths: new Map(),
  selectedKeyName: null,
  hasUnsavedChanges: false,
  loadError: null,

  loadFiles: (data, filePaths) => {
    set({
      locales: data,
      keys: buildKeysFromLocales(data),
      filePaths,
      selectedKeyName: null,
      hasUnsavedChanges: false,
      loadError: null,
    });
  },

  closeFiles: () => {
    set({
      locales: [],
      keys: [],
      filePaths: new Map(),
      selectedKeyName: null,
      hasUnsavedChanges: false,
      loadError: null,
    });
  },

  setLoadError: (error) => set({ loadError: error }),

  setSelectedKeyName: (name) => set({ selectedKeyName: name }),

  addKey: (key) => {
    set((state) => ({
      keys: [...state.keys, key],
      selectedKeyName: key.name,
      hasUnsavedChanges: true,
    }));
  },

  deleteSelectedKey: () => {
    set((state) => ({
      keys: state.keys.filter((k) => k.name !== state.selectedKeyName),
      selectedKeyName: null,
      hasUnsavedChanges: true,
    }));
  },

  setStringValue: (keyName, langCode, value) => {
    set((state) => ({
      keys: updateKey(state.keys, keyName, (k) => ({
        ...k,
        values: { ...k.values, [langCode]: value },
      })),
      hasUnsavedChanges: true,
    }));
  },

  setArrayElement: (keyName, langCode, index, value) => {
    set((state) => ({
      keys: updateKey(state.keys, keyName, (k) => {
        const arr = Array.isArray(k.values[langCode])
          ? [...(k.values[langCode] as string[])]
          : [];
        arr[index] = value;
        return { ...k, values: { ...k.values, [langCode]: arr } };
      }),
      hasUnsavedChanges: true,
    }));
  },

  removeArrayElement: (keyName, index) => {
    set((state) => ({
      keys: updateKey(state.keys, keyName, (k) => {
        const newVals = { ...k.values };
        for (const locale of state.locales) {
          if (Array.isArray(newVals[locale.languageCode])) {
            const arr = [...(newVals[locale.languageCode] as string[])];
            arr.splice(index, 1);
            newVals[locale.languageCode] = arr;
          }
        }
        return { ...k, values: newVals };
      }),
      hasUnsavedChanges: true,
    }));
  },

  addArrayElement: (keyName) => {
    set((state) => ({
      keys: updateKey(state.keys, keyName, (k) => {
        const newVals = { ...k.values };
        for (const locale of state.locales) {
          const arr = Array.isArray(newVals[locale.languageCode])
            ? [...(newVals[locale.languageCode] as string[])]
            : [];
          arr.push("");
          newVals[locale.languageCode] = arr;
        }
        return { ...k, values: newVals };
      }),
      hasUnsavedChanges: true,
    }));
  },

  clearEmptyArrayElements: (keyName) => {
    set((state) => ({
      keys: updateKey(state.keys, keyName, (k) => {
        const newVals = { ...k.values };
        const indicesToRemove = new Set<number>();
        let maxLen = 0;

        for (const locale of state.locales) {
          const arr = newVals[locale.languageCode];
          if (Array.isArray(arr) && arr.length > maxLen) maxLen = arr.length;
        }

        for (let i = 0; i < maxLen; i++) {
          let allEmpty = true;
          for (const locale of state.locales) {
            const arr = newVals[locale.languageCode];
            if (Array.isArray(arr) && arr[i] && arr[i].trim() !== "") {
              allEmpty = false;
              break;
            }
          }
          if (allEmpty) indicesToRemove.add(i);
        }

        if (indicesToRemove.size === 0) return k;

        for (const locale of state.locales) {
          if (Array.isArray(newVals[locale.languageCode])) {
            newVals[locale.languageCode] = (newVals[locale.languageCode] as string[]).filter((_, i) => !indicesToRemove.has(i));
          }
        }
        return { ...k, values: newVals };
      }),
      hasUnsavedChanges: true,
    }));
  },

  saveFiles: async () => {
    const { keys, locales, filePaths } = get();
    if (filePaths.size === 0) return;

    const updatedLocales = keysToLocaleData(keys, locales);

    for (const locale of updatedLocales) {
      const path = filePaths.get(locale.languageCode);
      if (!path) continue;
      const serialized = LocaleBlocSerializer.serialize(locale);
      await writeFile(path, serialized);
    }

    set({ hasUnsavedChanges: false, locales: updatedLocales });
  },
}));
