import { Dialog, Button, Flex, Text } from "@radix-ui/themes";
import { AlertCircle } from "lucide-react";

interface DeleteGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupPrefix: string;
  onConfirm: () => void;
}

export function DeleteGroupModal({
  open,
  onOpenChange,
  groupPrefix,
  onConfirm,
}: DeleteGroupModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="400px">
        <Dialog.Title>Delete Group</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Are you sure you want to delete the group that starts with{" "}
          <Text weight="bold">{groupPrefix}</Text>?
        </Dialog.Description>

        <Flex gap="3" align="start" style={{ color: "var(--red-11)" }} mb="4">
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
          <Text size="2">
            This action cannot be undone. All keys within this group will be
            permanently deleted.
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
              color="red"
              onClick={() => {
                onConfirm();
              }}
            >
              Delete Group
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
