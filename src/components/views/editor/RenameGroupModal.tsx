import { Dialog, Button, Flex, TextField, Text } from "@radix-ui/themes";
import { useState, useEffect } from "react";

interface RenameGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPrefix: string;
  onRename: (oldPrefix: string, newPrefix: string) => void;
}

export function RenameGroupModal({
  open,
  onOpenChange,
  currentPrefix,
  onRename,
}: RenameGroupModalProps) {
  const [newPrefix, setNewPrefix] = useState("");

  useEffect(() => {
    if (open) {
      setNewPrefix(currentPrefix);
    }
  }, [open, currentPrefix]);

  const handleRename = () => {
    const trimmed = newPrefix.trim();
    if (!trimmed || trimmed === currentPrefix) {
      onOpenChange(false);
      return;
    }
    onRename(currentPrefix, trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="400px">
        <Dialog.Title>Rename Group</Dialog.Title>
        <Dialog.Description size="2" color="gray">
          This will rename all keys that start with the prefix{" "}
          <Text weight="bold">{currentPrefix}</Text>.
        </Dialog.Description>

        <Flex direction="column" gap="3" mt="4">
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              New Prefix Name
            </Text>
            <TextField.Root
              value={newPrefix}
              onChange={(e) => setNewPrefix(e.target.value)}
              placeholder="Enter new prefix name"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
              }}
              autoFocus
            />
          </label>
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </Dialog.Close>
          <Button
            color="indigo"
            onClick={handleRename}
            disabled={!newPrefix.trim() || newPrefix.trim() === currentPrefix}
          >
            Rename Group
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
