import {
  Flex,
  Heading,
  Card,
  Tabs,
  Badge,
  ScrollArea,
  Table,
  Code,
  Text,
} from "@radix-ui/themes";
import { LocaleData } from "../../lib/bloc";

interface EditorViewProps {
  data: LocaleData[];
}

export function EditorView({ data }: EditorViewProps) {
  return (
    <Flex direction="column" gap="4" style={{ height: "100%" }}>
      <Flex align="center" justify="between">
        <Heading size="6">Localization Editor</Heading>
      </Flex>

      <Tabs.Root
        defaultValue="0"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <Tabs.List>
          {data.map((locale, index) => (
            <Tabs.Trigger key={index} value={String(index)}>
              {locale.languageCode || `File ${index + 1}`}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Card
          mt="2"
          style={{
            flex: 1,
            padding: 0,
            overflow: "hidden",
          }}
        >
          {data.map((parsedData, index) => (
            <Tabs.Content
              key={index}
              value={String(index)}
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Flex
                gap="3"
                align="center"
                p="3"
                style={{ borderBottom: "1px solid var(--gray-a4)" }}
              >
                <Badge size="2" color="blue">
                  Version: {parsedData.version}
                </Badge>
                <Badge size="2" color="green">
                  Language: {parsedData.languageCode}
                </Badge>
                <Badge size="2" color="orange">
                  Total Keys: {Object.keys(parsedData.translations).length}
                </Badge>
              </Flex>

              <ScrollArea
                type="auto"
                scrollbars="both"
                style={{ flex: 1, height: "100%" }}
              >
                <Table.Root variant="surface">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Key Name</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>
                        Extracted Value
                      </Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {Object.entries(parsedData.translations).map(
                      ([key, value]) => (
                        <Table.Row key={key}>
                          <Table.RowHeaderCell>
                            <Code variant="ghost">{key}</Code>
                          </Table.RowHeaderCell>
                          <Table.Cell>
                            {Array.isArray(value) ? (
                              <Flex direction="column" gap="1">
                                {value.map((v, i) => (
                                  <Text key={i} size="2">
                                    • {v}
                                  </Text>
                                ))}
                              </Flex>
                            ) : (
                              <Text size="2">
                                {value === null || value === undefined ? (
                                  <Text
                                    color="gray"
                                    style={{ fontStyle: "italic" }}
                                  >
                                    null
                                  </Text>
                                ) : (
                                  String(value)
                                )}
                              </Text>
                            )}
                          </Table.Cell>
                        </Table.Row>
                      ),
                    )}
                  </Table.Body>
                </Table.Root>
              </ScrollArea>
            </Tabs.Content>
          ))}
        </Card>
      </Tabs.Root>
    </Flex>
  );
}
