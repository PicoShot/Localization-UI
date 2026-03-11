import { Dialog, Button, Flex, Text } from "@radix-ui/themes";

interface PasteJsonDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyName: string;
  onReplace: () => void;
  onMerge: () => void;
}

export function PasteJsonDataModal({
  open,
  onOpenChange,
  keyName,
  onReplace,
  onMerge,
}: PasteJsonDataModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>Paste JSON Data</Dialog.Title>
        <Dialog.Description size="2">
          How would you like to apply the pasted data for{" "}
          <Text weight="bold">{keyName}</Text>?
        </Dialog.Description>

        <Flex direction="column" gap="3" mt="3">
          <Text size="2">
            • <strong>Replace:</strong> Clears all existing data and applies the pasted data.
          </Text>
          <Text size="2">
            • <strong>Merge:</strong> Only fills values that are currently empty.
          </Text>

          <Flex gap="3" mt="4" justify="end">
            <Button
              variant="soft"
              color="gray"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button variant="soft" color="blue" onClick={onMerge}>
              Merge Data
            </Button>
            <Button color="red" onClick={onReplace}>
              Replace Data
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
