import { Dialog, Button, Flex, Text } from "@radix-ui/themes";

interface ClearValuesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyName: string;
  onConfirm: () => void;
}

export function ClearValuesModal({
  open,
  onOpenChange,
  keyName,
  onConfirm,
}: ClearValuesModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="420px">
        <Dialog.Title>Clear Values</Dialog.Title>
        <Dialog.Description size="2">
          Are you sure you want to clear all translation values for this key?
        </Dialog.Description>

        <Flex direction="column" gap="3" mt="3">
          <Text size="2" weight="medium" style={{ fontFamily: "monospace" }}>
            {keyName}
          </Text>

          <Flex gap="3" mt="2" justify="end">
            <Button
              variant="soft"
              color="gray"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button color="red" onClick={onConfirm}>
              Clear
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
