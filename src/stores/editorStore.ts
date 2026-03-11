import { create } from "zustand";
import { LocaleBlocSerializer, LocaleData } from "@/lib/bloc";
import { UnifiedKey } from "@/types/types";
import { writeFile } from "@tauri-apps/plugin-fs";
import { saveSession, loadSession, clearSession } from "@/lib/session";
import { loadBlocFilesFromPaths } from "@/lib/loadBlocFiles";

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
  renameKey: (oldName: string, newName: string) => void;
  deleteSelectedKey: () => void;
  setKeyValues: (
    keyName: string,
    values: Record<string, string | string[] | null | undefined>,
  ) => void;
  setStringValue: (keyName: string, langCode: string, value: string) => void;
  setArrayElement: (
    keyName: string,
    langCode: string,
    index: number,
    value: string,
  ) => void;
  removeArrayElement: (keyName: string, index: number) => void;
  addArrayElement: (keyName: string) => void;
  clearEmptyArrayElements: (keyName: string) => void;
  clearKeyValues: (keyName: string) => void;
  renameGroup: (groupPath: string, newPrefix: string) => void;
  deleteGroup: (groupPath: string) => void;
  clearGroupValues: (groupPath: string) => void;
  saveFiles: () => Promise<void>;
  restoreSession: () => Promise<void>;
  moveKey: (sourceKeyName: string, targetKeyName: string) => void;
  importJsonData: (
    data: Record<string, Record<string, string | string[]>>,
    targetLocales: string[],
    replace: boolean,
  ) => void;
  clearAllData: (deleteKeys: boolean) => void;
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

function updateKey(
  keys: UnifiedKey[],
  keyName: string,
  updater: (key: UnifiedKey) => UnifiedKey,
): UnifiedKey[] {
  return keys.map((k) => {
    if (k.name !== keyName) return k;
    return updater(k);
  });
}

function keysToLocaleData(
  keys: UnifiedKey[],
  locales: LocaleData[],
): LocaleData[] {
  return locales.map((locale) => {
    const translations: Record<string, string | string[] | null | undefined> =
      {};
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

function isKeyInGroup(keyName: string, groupPath: string): boolean {
  const segments = keyName.split(/[_.]/);
  const groupSegments = groupPath.split("_");
  if (segments.length <= groupSegments.length) return false;
  for (let i = 0; i < groupSegments.length; i++) {
    if (segments[i] !== groupSegments[i]) return false;
  }
  return true;
}

function replaceGroupPrefix(
  keyName: string,
  groupPath: string,
  newPrefix: string,
): string {
  const groupSegments = groupPath.split("_");
  let matchLength = 0;
  let segIndex = 0;

  const regex = /[^_.]+|[_.]/g;
  let match;
  while ((match = regex.exec(keyName)) !== null) {
    const text = match[0];
    if (text !== "_" && text !== ".") {
      if (text === groupSegments[segIndex]) {
        segIndex++;
        if (segIndex === groupSegments.length) {
          matchLength = match.index + text.length;
          break;
        }
      } else {
        break;
      }
    }
  }

  if (matchLength > 0 && segIndex === groupSegments.length) {
    return newPrefix + keyName.substring(matchLength);
  }
  return keyName;
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
    saveSession(filePaths, null);
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
    clearSession();
  },

  setLoadError: (error) => set({ loadError: error }),

  setSelectedKeyName: (name) => {
    set({ selectedKeyName: name });
    saveSession(get().filePaths, name);
  },

  addKey: (key) => {
    set((state) => ({
      keys: [...state.keys, key],
      selectedKeyName: key.name,
      hasUnsavedChanges: true,
    }));
  },

  renameKey: (oldName, newName) => {
    set((state) => ({
      keys: state.keys.map((k) => {
        if (k.name !== oldName) return k;
        return { ...k, name: newName };
      }),
      selectedKeyName:
        state.selectedKeyName === oldName ? newName : state.selectedKeyName,
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

  setKeyValues: (keyName, values) => {
    set((state) => ({
      keys: updateKey(state.keys, keyName, (k) => ({
        ...k,
        values: { ...k.values, ...values },
      })),
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
            newVals[locale.languageCode] = (
              newVals[locale.languageCode] as string[]
            ).filter((_, i) => !indicesToRemove.has(i));
          }
        }
        return { ...k, values: newVals };
      }),
      hasUnsavedChanges: true,
    }));
  },

  clearKeyValues: (keyName) => {
    set((state) => ({
      keys: updateKey(state.keys, keyName, (k) => {
        const cleared: Record<string, string | string[] | null | undefined> =
          {};
        for (const [lang, val] of Object.entries(k.values)) {
          cleared[lang] = Array.isArray(val) ? val.map(() => "") : "";
        }
        return { ...k, values: cleared };
      }),
      hasUnsavedChanges: true,
    }));
  },

  renameGroup: (groupPath, newPrefix) => {
    set((state) => {
      const newKeys = state.keys.map((k) => {
        if (!isKeyInGroup(k.name, groupPath)) return k;
        const newName = replaceGroupPrefix(k.name, groupPath, newPrefix);
        return { ...k, name: newName };
      });
      return { keys: newKeys, hasUnsavedChanges: true };
    });
  },

  deleteGroup: (groupPath) => {
    set((state) => {
      const remainingKeys = state.keys.filter(
        (k) => !isKeyInGroup(k.name, groupPath),
      );
      let selectedKeyName = state.selectedKeyName;
      if (selectedKeyName && isKeyInGroup(selectedKeyName, groupPath)) {
        selectedKeyName = null;
      }
      return { keys: remainingKeys, selectedKeyName, hasUnsavedChanges: true };
    });
  },

  clearGroupValues: (groupPath) => {
    set((state) => {
      const newKeys = state.keys.map((k) => {
        if (!isKeyInGroup(k.name, groupPath)) return k;
        const cleared: Record<string, string | string[] | null | undefined> =
          {};
        for (const [lang, val] of Object.entries(k.values)) {
          cleared[lang] = Array.isArray(val) ? val.map(() => "") : "";
        }
        return { ...k, values: cleared };
      });
      return { keys: newKeys, hasUnsavedChanges: true };
    });
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

  restoreSession: async () => {
    const record = loadSession();
    if (!record) return;

    try {
      const paths = Object.values(record.filePaths);
      if (paths.length === 0) {
        clearSession();
        return;
      }

      const { locales, filePaths } = await loadBlocFilesFromPaths(paths);
      if (locales.length === 0) {
        clearSession();
        return;
      }

      set({
        locales,
        keys: buildKeysFromLocales(locales),
        filePaths,
        selectedKeyName: record.selectedKeyName,
        hasUnsavedChanges: false,
        loadError: null,
      });

      saveSession(filePaths, record.selectedKeyName);
    } catch {
      clearSession();
    }
  },

  moveKey: (sourceKeyName, targetKeyName) => {
    set((state) => {
      const sourceIndex = state.keys.findIndex((k) => k.name === sourceKeyName);
      const targetIndex = state.keys.findIndex((k) => k.name === targetKeyName);

      if (
        sourceIndex === -1 ||
        targetIndex === -1 ||
        sourceIndex === targetIndex
      ) {
        return state;
      }

      const newKeys = [...state.keys];
      const [movedItem] = newKeys.splice(sourceIndex, 1);
      newKeys.splice(targetIndex, 0, movedItem);

      return { keys: newKeys, hasUnsavedChanges: true };
    });
  },

  importJsonData: (data, targetLocales, replace) => {
    set((state) => {
      const newKeys = [...state.keys];

      for (const [keyName, translations] of Object.entries(data)) {
        let existingKeyIndex = newKeys.findIndex((k) => k.name === keyName);
        let existingKey =
          existingKeyIndex >= 0 ? newKeys[existingKeyIndex] : null;

        if (!existingKey) {
          let isArray = false;
          for (const val of Object.values(translations)) {
            if (Array.isArray(val)) isArray = true;
          }

          existingKey = {
            name: keyName,
            type: isArray ? "array" : "string",
            values: {},
          };

          newKeys.push(existingKey);
          existingKeyIndex = newKeys.length - 1;
        }

        const updatedValues = { ...existingKey.values };

        for (const lang of targetLocales) {
          if (lang in translations) {
            const newVal = translations[lang];
            if (replace) {
              updatedValues[lang] = newVal;
            } else {
              const existingVal = updatedValues[lang];
              const isExistingEmpty =
                !existingVal ||
                (typeof existingVal === "string" &&
                  existingVal.trim() === "") ||
                (Array.isArray(existingVal) && existingVal.length === 0) ||
                (Array.isArray(existingVal) &&
                  existingVal.every(
                    (v) => typeof v !== "string" || v.trim() === "",
                  ));

              if (isExistingEmpty) {
                updatedValues[lang] = newVal;
              }
            }
          } else if (replace) {
            updatedValues[lang] = existingKey.type === "array" ? [] : "";
          }
        }

        newKeys[existingKeyIndex] = { ...existingKey, values: updatedValues };
      }

      return { keys: newKeys, hasUnsavedChanges: true };
    });
  },

  clearAllData: (deleteKeys) => {
    set((state) => {
      if (deleteKeys) {
        return { keys: [], selectedKeyName: null, hasUnsavedChanges: true };
      } else {
        const newKeys = state.keys.map((k) => {
          const cleared: Record<string, string | string[] | null | undefined> =
            {};
          for (const [lang, val] of Object.entries(k.values)) {
            cleared[lang] = Array.isArray(val) ? val.map(() => "") : "";
          }
          return { ...k, values: cleared };
        });
        return { keys: newKeys, hasUnsavedChanges: true };
      }
    });
  },
}));
