import { Flex, Heading, Card, Text } from "@radix-ui/themes";

export function SettingsView() {
  return (
    <Flex direction="column" gap="4" style={{ height: "100%" }}>
      <Heading size="6">Editor Settings</Heading>
      <Card style={{ flex: 1 }}>
        <Text color="gray">Settings and configuration will go here...</Text>
      </Card>
    </Flex>
  );
}
