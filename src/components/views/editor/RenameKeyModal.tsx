import { Dialog, Button, Flex, TextField, Text } from "@radix-ui/themes";
import { useState } from "react";
import { UnifiedKey } from "@/types/types";

interface RenameKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  existingKeys: UnifiedKey[];
  onRename: (oldName: string, newName: string) => void;
}

export function RenameKeyModal({
  open,
  onOpenChange,
  currentName,
  existingKeys,
  onRename,
}: RenameKeyModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [prevOpen, setPrevOpen] = useState(open);
  const [prevCurrentName, setPrevCurrentName] = useState(currentName);

  if (open !== prevOpen || currentName !== prevCurrentName) {
    setPrevOpen(open);
    setPrevCurrentName(currentName);
    if (open) {
      setName(currentName);
      setError(null);
    }
  }

  const validate = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return "Key name cannot be empty.";
    if (trimmed === currentName) return "Name is unchanged.";
    if (existingKeys.some((k) => k.name === trimmed))
      return `Key "${trimmed}" already exists.`;
    if (/\s/.test(trimmed)) return "Key name cannot contain whitespace.";
    return null;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (error) setError(validate(value));
  };

  const handleRename = () => {
    const validationError = validate(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    onRename(currentName, name.trim());
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRename();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="420px">
        <Dialog.Title>Rename Key</Dialog.Title>
        <Dialog.Description size="2">
          Enter a new name for the localization key.
        </Dialog.Description>

        <Flex direction="column" gap="4" mt="2">
          <Flex direction="column" gap="1">
            <Text size="2" weight="medium">
              Key Name
            </Text>
            <TextField.Root
              placeholder="e.g. menu_title"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            {error && (
              <Text size="1" color="red">
                {error}
              </Text>
            )}
          </Flex>

          <Flex gap="3" mt="2" justify="end">
            <Button
              variant="soft"
              color="gray"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRename}>Rename</Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
