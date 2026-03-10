import { Flex, Heading, Text, Card } from "@radix-ui/themes";
import { DragDropZone } from "@/components/DragDropZone";
import { useEditorStore } from "@/stores/editorStore";

export function MainPage() {
  const loadError = useEditorStore((s) => s.loadError);

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      gap="5"
      style={{
        height: "100%",
        width: "100%",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <Flex direction="column" align="center" gap="2">
        <Heading size="8" align="center">
          PicoShot Localization
        </Heading>
        <Text size="4" color="gray" align="center">
          Start by dropping your game's .bloc files or folders to edit.
        </Text>
      </Flex>

      <div style={{ width: "100%", minHeight: "250px" }}>
        <DragDropZone />
      </div>

      {loadError && (
        <Card
          style={{
            backgroundColor: "var(--red-a3)",
            borderColor: "var(--red-a6)",
            border: "1px solid",
            width: "100%",
          }}
        >
          <Text color="red" weight="bold" align="center" as="p">
            Error: {loadError}
          </Text>
        </Card>
      )}
    </Flex>
  );
}
