import { Dialog, Button, Flex, TextArea } from "@radix-ui/themes";
import { useState, useEffect } from "react";

interface RichTextEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: string;
  onSave: (value: string) => void;
  title?: string;
}

export function RichTextEditorModal({
  open,
  onOpenChange,
  initialValue,
  onSave,
  title = "Edit Text",
}: RichTextEditorModalProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
    }
  }, [open, initialValue]);

  const handleSave = () => {
    onSave(value);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        maxWidth="800px"
        style={{
          width: "90vw",
          height: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Description size="2">
          Edit the content for this translation key.
        </Dialog.Description>
        <Flex direction="column" gap="3" style={{ flexGrow: 1 }}>
          <TextArea
            size="3"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{ flexGrow: 1, minHeight: "300px", fontFamily: "inherit" }}
            placeholder="Enter text..."
          />
          <Flex gap="3" mt="4" justify="end">
            <Button
              variant="soft"
              color="gray"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
