import { useState, useMemo } from "react";
import { Flex, Button, TextField, IconButton, Checkbox, Text, ScrollArea } from "@radix-ui/themes";
import { Type, List, Search, X } from "lucide-react";
import { UnifiedKey } from "./types";
import { KeyListItem } from "./KeyListItem";

interface KeyListSidebarProps {
  width: number;
  keys: UnifiedKey[];
  setKeys: React.Dispatch<React.SetStateAction<UnifiedKey[]>>;
  selectedKeyName: string | null;
  setSelectedKeyName: (name: string | null) => void;
}

export function KeyListSidebar({
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
      {/* Add Actions */}
      <Flex p="3" gap="2" style={{ borderBottom: "1px solid var(--gray-a4)" }}>
        <Button
          variant="soft"
          size="2"
          style={{ flex: 1 }}
          onClick={() => {
            const newName = "new_string_key_" + Date.now();
            setKeys([...keys, { name: newName, type: "string", values: {} }]);
            setSelectedKeyName(newName);
          }}
        >
          <Type size={16} /> String Key
        </Button>
        <Button
          variant="soft"
          size="2"
          color="indigo"
          style={{ flex: 1 }}
          onClick={() => {
            const newName = "new_array_key_" + Date.now();
            setKeys([...keys, { name: newName, type: "array", values: {} }]);
            setSelectedKeyName(newName);
          }}
        >
          <List size={16} /> Array Key
        </Button>
      </Flex>

      {/* Search & Filters */}
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
            <IconButton variant="ghost" size="2" onClick={() => setSearchQuery("")}>
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
              onSelect={setSelectedKeyName}
            />
          ))}
        </Flex>
      </ScrollArea>
    </Flex>
  );
}
