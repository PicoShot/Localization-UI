import { useState, useMemo, useCallback, memo } from "react";
import {
  Flex,
  Button,
  TextField,
  IconButton,
  Checkbox,
  Text,
  ScrollArea,
} from "@radix-ui/themes";
import { Plus, Search, X, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { UnifiedKey } from "@/types/types";
import { KeyListItem } from "./KeyListItem";
import { KeyTreeGroupRow } from "./KeyTreeGroupRow";
import { AddKeyModal } from "./AddKeyModal";
import { DeleteKeyModal } from "./DeleteKeyModal";
import { RenameKeyModal } from "./RenameKeyModal";
import { ClearValuesModal } from "./ClearValuesModal";
import { TranslateDeeplModal } from "./TranslateDeeplModal";
import { TranslateGeminiModal } from "./TranslateGeminiModal";
import { useEditorStore } from "@/stores/editorStore";
import { readText } from "@tauri-apps/plugin-clipboard-manager";
import {
  buildKeyTree,
  flattenTree,
  collectAllGroupPaths,
} from "@/utils/keyTree";

interface KeyListSidebarProps {
  width: number;
  keys: UnifiedKey[];
  selectedKeyName: string | null;
  setSelectedKeyName: (name: string | null) => void;
}

export const KeyListSidebar = memo(function KeyListSidebar({
  width,
  keys,
  selectedKeyName,
  setSelectedKeyName,
}: KeyListSidebarProps) {
  const addKey = useEditorStore((s) => s.addKey);
  const renameKey = useEditorStore((s) => s.renameKey);
  const setKeyValues = useEditorStore((s) => s.setKeyValues);
  const clearKeyValues = useEditorStore((s) => s.clearKeyValues);
  const deleteSelectedKey = useEditorStore((s) => s.deleteSelectedKey);
  const [searchQuery, setSearchQuery] = useState("");
  const [showStrings, setShowStrings] = useState(true);
  const [showArrays, setShowArrays] = useState(true);
  const [sortByName, setSortByName] = useState(true);
  const [showAddKey, setShowAddKey] = useState(false);
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string | null>(null);
  const [pendingRenameKey, setPendingRenameKey] = useState<string | null>(null);
  const [pendingClearKey, setPendingClearKey] = useState<string | null>(null);
  const [pendingTranslateDeepLKey, setPendingTranslateDeepLKey] = useState<string | null>(null);
  const [pendingTranslateGeminiKey, setPendingTranslateGeminiKey] = useState<string | null>(null);
  const [groupByPrefix, setGroupByPrefix] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(),
  );

  const filteredKeys = useMemo(() => {
    let result = keys.filter((k) => {
      if (!showStrings && k.type === "string") return false;
      if (!showArrays && k.type === "array") return false;
      if (
        searchQuery &&
        !k.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });

    if (sortByName) {
      result = result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [keys, searchQuery, showStrings, showArrays, sortByName]);

  const handleSelect = useCallback(
    (name: string) => setSelectedKeyName(name),
    [setSelectedKeyName],
  );

  const tree = useMemo(() => {
    if (!groupByPrefix) return [];
    return buildKeyTree(filteredKeys, sortByName);
  }, [groupByPrefix, filteredKeys, sortByName]);

  const allGroupPaths = useMemo(() => {
    const paths = new Set<string>();
    if (groupByPrefix) collectAllGroupPaths(tree, paths);
    return paths;
  }, [groupByPrefix, tree]);

  const activeExpandedPaths = useMemo(() => {
    if (searchQuery) return allGroupPaths;
    return expandedPaths;
  }, [searchQuery, allGroupPaths, expandedPaths]);

  const renderItems = useMemo(() => {
    if (!groupByPrefix) return [];
    return flattenTree(tree, activeExpandedPaths, 0);
  }, [groupByPrefix, tree, activeExpandedPaths]);

  const toggleGroup = useCallback((fullPath: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(fullPath)) next.delete(fullPath);
      else next.add(fullPath);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedPaths(new Set(allGroupPaths));
  }, [allGroupPaths]);

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set());
  }, []);

  const handleAddKey = useCallback(
    (newKey: UnifiedKey) => {
      addKey(newKey);
    },
    [addKey],
  );

  const handleDeleteRequest = useCallback((name: string) => {
    setPendingDeleteKey(name);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!pendingDeleteKey) return;
    setSelectedKeyName(pendingDeleteKey);
    deleteSelectedKey();
    setPendingDeleteKey(null);
  }, [pendingDeleteKey, setSelectedKeyName, deleteSelectedKey]);

  const handleRenameRequest = useCallback((name: string) => {
    setPendingRenameKey(name);
  }, []);

  const handleConfirmRename = useCallback(
    (oldName: string, newName: string) => {
      renameKey(oldName, newName);
      setPendingRenameKey(null);
    },
    [renameKey],
  );

  const handleClearRequest = useCallback((name: string) => {
    setPendingClearKey(name);
  }, []);

  const handleConfirmClear = useCallback(() => {
    if (!pendingClearKey) return;
    clearKeyValues(pendingClearKey);
    setPendingClearKey(null);
  }, [pendingClearKey, clearKeyValues]);

  const handlePasteName = useCallback(
    async (keyName: string) => {
      const text = (await readText()).trim();
      if (!text || /\s/.test(text)) return;
      if (text === keyName) return;
      if (keys.some((k) => k.name === text)) return;
      renameKey(keyName, text);
    },
    [keys, renameKey],
  );

  const handlePasteJsonData = useCallback(
    async (keyName: string) => {
      const text = await readText();
      try {
        const parsed = JSON.parse(text);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return;
        const values: Record<string, string | string[]> = {};
        for (const [lang, val] of Object.entries(parsed)) {
          if (typeof val === "string") {
            values[lang] = val;
          } else if (
            Array.isArray(val) &&
            val.every((v) => typeof v === "string")
          ) {
            values[lang] = val as string[];
          }
        }
        if (Object.keys(values).length === 0) return;
        setKeyValues(keyName, values);
      } catch {
        return;
      }
    },
    [setKeyValues],
  );

  const handleTranslateDeepLRequest = useCallback((name: string) => {
    setPendingTranslateDeepLKey(name);
  }, []);

  const pendingTranslateItem = useMemo(() => {
    if (!pendingTranslateDeepLKey) return null;
    return keys.find(k => k.name === pendingTranslateDeepLKey) || null;
  }, [pendingTranslateDeepLKey, keys]);

  const handleTranslateGeminiRequest = useCallback((name: string) => {
    setPendingTranslateGeminiKey(name);
  }, []);

  const pendingTranslateGeminiItem = useMemo(() => {
    if (!pendingTranslateGeminiKey) return null;
    return keys.find(k => k.name === pendingTranslateGeminiKey) || null;
  }, [pendingTranslateGeminiKey, keys]);

  const localeCodes = useEditorStore((s) => s.locales).map(l => l.languageCode);

  return (
    <Flex
      direction="column"
      style={{
        width,
        borderRight: "1px solid var(--gray-a4)",
        backgroundColor: "var(--gray-2)",
        flexShrink: 0,
      }}
    >
      <Flex p="3" gap="2" style={{ borderBottom: "1px solid var(--gray-a4)" }}>
        <Button
          variant="soft"
          size="2"
          color="indigo"
          style={{ flex: 1 }}
          onClick={() => setShowAddKey(true)}
        >
          <Plus size={18} /> Add Key
        </Button>
      </Flex>

      <Flex
        direction="column"
        p="3"
        gap="3"
        style={{ borderBottom: "1px solid var(--gray-a4)" }}
      >
        <Flex gap="2" align="center">
          <TextField.Root
            placeholder="Search..."
            style={{ flex: 1 }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          >
            <TextField.Slot>
              <Search size={16} />
            </TextField.Slot>
          </TextField.Root>
          {searchQuery && (
            <IconButton
              variant="ghost"
              size="2"
              onClick={() => setSearchQuery("")}
            >
              <X size={16} />
            </IconButton>
          )}
        </Flex>

        <Flex gap="3" wrap="wrap" align="center">
          <Text as="label" size="2">
            <Flex gap="2" align="center">
              <Checkbox
                checked={showStrings}
                onCheckedChange={(c) => setShowStrings(!!c)}
              />
              Strings
            </Flex>
          </Text>
          <Text as="label" size="2">
            <Flex gap="2" align="center">
              <Checkbox
                checked={showArrays}
                onCheckedChange={(c) => setShowArrays(!!c)}
              />
              Arrays
            </Flex>
          </Text>
          <Text as="label" size="2">
            <Flex gap="2" align="center">
              <Checkbox
                checked={sortByName}
                onCheckedChange={(c) => setSortByName(!!c)}
              />
              Sort A-Z
            </Flex>
          </Text>
          <Text as="label" size="2">
            <Flex gap="2" align="center">
              <Checkbox
                checked={groupByPrefix}
                onCheckedChange={(c) => setGroupByPrefix(!!c)}
              />
              Group
            </Flex>
          </Text>
        </Flex>
        <Flex gap="4" align="center">
          <Text size="1" color="gray">
            Found: {filteredKeys.length} / {keys.length} keys
          </Text>
          {groupByPrefix && (
            <>
              <IconButton
                variant="ghost"
                size="1"
                title="Expand All"
                onClick={expandAll}
              >
                <ChevronsUpDown size={14} />
              </IconButton>
              <IconButton
                variant="ghost"
                size="1"
                title="Collapse All"
                onClick={collapseAll}
              >
                <ChevronsDownUp size={14} />
              </IconButton>
            </>
          )}
        </Flex>
      </Flex>

      <ScrollArea type="auto" style={{ flex: 1 }}>
        <Flex direction="column" p="1">
          {groupByPrefix
            ? renderItems.map((item) =>
                item.kind === "group" ? (
                  <KeyTreeGroupRow
                    key={`g:${item.node.fullPath}`}
                    node={item.node}
                    depth={item.depth}
                    isExpanded={activeExpandedPaths.has(item.node.fullPath)}
                    onToggle={toggleGroup}
                  />
                ) : (
                  <KeyListItem
                    key={item.node.key.name}
                    item={item.node.key}
                    isSelected={item.node.key.name === selectedKeyName}
                    onSelect={handleSelect}
                    onDelete={handleDeleteRequest}
                    onRename={handleRenameRequest}
                    onClearValues={handleClearRequest}
                    onPasteName={handlePasteName}
                    onPasteJsonData={handlePasteJsonData}
                    onTranslateDeepL={handleTranslateDeepLRequest}
                    onTranslateGemini={handleTranslateGeminiRequest}
                    displayName={item.node.label}
                    depth={item.depth}
                  />
                ),
              )
            : filteredKeys.map((k) => (
                <KeyListItem
                  key={k.name}
                  item={k}
                  isSelected={k.name === selectedKeyName}
                  onSelect={handleSelect}
                  onDelete={handleDeleteRequest}
                  onRename={handleRenameRequest}
                  onClearValues={handleClearRequest}
                  onPasteName={handlePasteName}
                  onPasteJsonData={handlePasteJsonData}
                  onTranslateDeepL={handleTranslateDeepLRequest}
                  onTranslateGemini={handleTranslateGeminiRequest}
                />
              ))}
        </Flex>
      </ScrollArea>

      <AddKeyModal
        open={showAddKey}
        onOpenChange={setShowAddKey}
        existingKeys={keys}
        onAdd={handleAddKey}
      />

      <TranslateDeeplModal
        open={pendingTranslateDeepLKey !== null}
        onOpenChange={(open) => { if (!open) setPendingTranslateDeepLKey(null); }}
        keyName={pendingTranslateDeepLKey ?? ""}
        item={pendingTranslateItem}
        localeCodes={localeCodes}
      />

      <TranslateGeminiModal
        open={pendingTranslateGeminiKey !== null}
        onOpenChange={(open) => { if (!open) setPendingTranslateGeminiKey(null); }}
        keyName={pendingTranslateGeminiKey ?? ""}
        item={pendingTranslateGeminiItem}
        localeCodes={localeCodes}
      />

      <DeleteKeyModal
        open={pendingDeleteKey !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteKey(null); }}
        keyName={pendingDeleteKey ?? ""}
        onConfirm={handleConfirmDelete}
      />

      <RenameKeyModal
        open={pendingRenameKey !== null}
        onOpenChange={(open) => { if (!open) setPendingRenameKey(null); }}
        currentName={pendingRenameKey ?? ""}
        existingKeys={keys}
        onRename={handleConfirmRename}
      />

      <ClearValuesModal
        open={pendingClearKey !== null}
        onOpenChange={(open) => { if (!open) setPendingClearKey(null); }}
        keyName={pendingClearKey ?? ""}
        onConfirm={handleConfirmClear}
      />
    </Flex>
  );
});
