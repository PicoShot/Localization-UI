import { Dialog, Button, Flex, Text } from "@radix-ui/themes";
import { AlertCircle } from "lucide-react";

interface ClearGroupValuesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupPrefix: string;
  onConfirm: () => void;
}

export function ClearGroupValuesModal({
  open,
  onOpenChange,
  groupPrefix,
  onConfirm,
}: ClearGroupValuesModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="400px">
        <Dialog.Title>Clear Group Values</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Are you sure you want to clear values for all keys in the group{" "}
          <Text weight="bold">{groupPrefix}</Text>?
        </Dialog.Description>

        <Flex
          gap="3"
          align="start"
          style={{ color: "var(--orange-11)" }}
          mb="4"
        >
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
          <Text size="2">
            This will empty out all translations for all keys in this group across all languages. The keys themselves will not be deleted.
          </Text>
        </Flex>

        <Flex gap="3" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </Dialog.Close>
          <Dialog.Close>
            <Button
              color="orange"
              onClick={() => {
                onConfirm();
              }}
            >
              Clear Values
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
