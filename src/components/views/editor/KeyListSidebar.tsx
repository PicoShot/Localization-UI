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
import { Plus, Search, X } from "lucide-react";
import { UnifiedKey } from "./types";
import { KeyListItem } from "./KeyListItem";
import { AddKeyModal } from "./AddKeyModal";

interface KeyListSidebarProps {
  width: number;
  keys: UnifiedKey[];
  setKeys: React.Dispatch<React.SetStateAction<UnifiedKey[]>>;
  selectedKeyName: string | null;
  setSelectedKeyName: (name: string | null) => void;
}

export const KeyListSidebar = memo(function KeyListSidebar({
  width,
  keys,
  setKeys,
  selectedKeyName,
  setSelectedKeyName,
}: KeyListSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showStrings, setShowStrings] = useState(true);
  const [showArrays, setShowArrays] = useState(true);
  const [sortByName, setSortByName] = useState(true);
  const [showAddKey, setShowAddKey] = useState(false);

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

  const handleAddKey = useCallback(
    (newKey: UnifiedKey) => {
      setKeys((prev) => [...prev, newKey]);
      setSelectedKeyName(newKey.name);
    },
    [setKeys, setSelectedKeyName],
  );

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
        </Flex>
        <Text size="1" color="gray">
          Found: {filteredKeys.length} / {keys.length} keys
        </Text>
      </Flex>

      {/* Keys List */}
      <ScrollArea type="auto" style={{ flex: 1 }}>
        <Flex direction="column" p="1">
          {filteredKeys.map((k) => (
            <KeyListItem
              key={k.name}
              item={k}
              isSelected={k.name === selectedKeyName}
              onSelect={handleSelect}
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
    </Flex>
  );
});
