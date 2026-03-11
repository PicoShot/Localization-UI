import { useState } from "react";
import {
  Dialog,
  Button,
  Flex,
  Text,
  RadioGroup,
  Callout,
} from "@radix-ui/themes";
import { TriangleAlert } from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";

interface ClearAllDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClearAllDataModal({
  open,
  onOpenChange,
}: ClearAllDataModalProps) {
  const [clearMethod, setClearMethod] = useState<"values" | "keys">("values");
  const clearAllData = useEditorStore((s) => s.clearAllData);

  const handleClear = () => {
    clearAllData(clearMethod === "keys");
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>Clear All Data</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Are you sure you want to clear all data? This action cannot be undone
          unless you have an external backup.
        </Dialog.Description>

        <Flex direction="column" gap="4">
          <Callout.Root color="red" size="1">
            <Callout.Icon>
              <TriangleAlert />
            </Callout.Icon>
            <Callout.Text>
              This will affect all keys and languages in your project. Please
              make sure you have exported your data if you need to keep a copy.
            </Callout.Text>
          </Callout.Root>

          <RadioGroup.Root
            value={clearMethod}
            onValueChange={(val: "values" | "keys") => setClearMethod(val)}
          >
            <Flex direction="column" gap="2">
              <Text as="label" size="2">
                <Flex gap="2">
                  <RadioGroup.Item value="values" /> Clear Translation Values
                  Only
                </Flex>
                <Text
                  size="1"
                  color="gray"
                  style={{ paddingLeft: "24px", display: "block" }}
                >
                  Keeps all keys intact but empties their translation fields.
                </Text>
              </Text>
              <Text as="label" size="2">
                <Flex gap="2">
                  <RadioGroup.Item value="keys" /> Delete All Keys
                </Flex>
                <Text
                  size="1"
                  color="gray"
                  style={{ paddingLeft: "24px", display: "block" }}
                >
                  Completely removes all keys and their translations from the
                  project.
                </Text>
              </Text>
            </Flex>
          </RadioGroup.Root>
        </Flex>

        <Flex gap="3" mt="5" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </Dialog.Close>
          <Button color="red" onClick={handleClear}>
            Clear Data
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
