import {
  Dialog,
  Button,
  Flex,
  TextField,
  Text,
  RadioGroup,
} from "@radix-ui/themes";
import { useState, useEffect } from "react";
import { UnifiedKey } from "@/types/types";

interface AddKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingKeys: UnifiedKey[];
  onAdd: (key: UnifiedKey) => void;
  initialName?: string;
}

export function AddKeyModal({
  open,
  onOpenChange,
  existingKeys,
  onAdd,
  initialName,
}: AddKeyModalProps) {
  const [name, setName] = useState(initialName ?? "");
  const [type, setType] = useState<"string" | "array">("string");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initialName ?? "");
      setType("string");
      setError(null);
    }
  }, [open, initialName]);

  const validate = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return "Key name cannot be empty.";
    if (existingKeys.some((k) => k.name === trimmed))
      return `Key "${trimmed}" already exists.`;
    if (/\s/.test(trimmed)) return "Key name cannot contain whitespace.";
    return null;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (error) setError(validate(value));
  };

  const handleAdd = () => {
    const validationError = validate(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    onAdd({ name: name.trim(), type, values: {} });
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="420px">
        <Dialog.Title>Add New Key</Dialog.Title>
        <Dialog.Description size="2">
          Enter a unique name and select the type for the new localization key.
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

          <Flex direction="column" gap="1">
            <Text size="2" weight="medium">
              Key Type
            </Text>
            <RadioGroup.Root
              value={type}
              onValueChange={(v) => setType(v as "string" | "array")}
            >
              <Flex direction="column" gap="2">
                <Text as="label" size="2">
                  <Flex gap="2" align="center">
                    <RadioGroup.Item value="string" />
                    String - single text value per language
                  </Flex>
                </Text>
                <Text as="label" size="2">
                  <Flex gap="2" align="center">
                    <RadioGroup.Item value="array" />
                    Array - list of text values per language
                  </Flex>
                </Text>
              </Flex>
            </RadioGroup.Root>
          </Flex>

          <Flex gap="3" mt="2" justify="end">
            <Button
              variant="soft"
              color="gray"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Key</Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
