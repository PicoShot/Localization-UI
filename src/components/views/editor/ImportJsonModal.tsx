import { useState } from "react";
import {
  Dialog,
  Button,
  Flex,
  Text,
  RadioGroup,
  Callout,
} from "@radix-ui/themes";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { useEditorStore } from "@/stores/editorStore";
import { FileWarning, FileText } from "lucide-react";

interface ImportJsonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportJsonModal({ open, onOpenChange }: ImportJsonModalProps) {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<Record<
    string,
    Record<string, string | string[]>
  > | null>(null);
  const [localesInData, setLocalesInData] = useState<string[]>([]);
  const [importMethod, setImportMethod] = useState<"replace" | "merge">(
    "merge",
  );
  const [error, setError] = useState<string | null>(null);

  const importJsonData = useEditorStore((s) => s.importJsonData);

  const handleSelectFile = async () => {
    try {
      const selected = await openDialog({
        multiple: false,
        filters: [
          {
            name: "JSON",
            extensions: ["json"],
          },
        ],
      });

      if (!selected || Array.isArray(selected)) return;

      const content = await readTextFile(selected);
      const data = JSON.parse(content);

      if (typeof data !== "object" || data === null || Array.isArray(data)) {
        throw new Error(
          "Invalid root structure. Expected an object mapping keys to language objects.",
        );
      }

      const locales = new Set<string>();
      for (const [keyName, translations] of Object.entries(data)) {
        if (
          typeof translations !== "object" ||
          translations === null ||
          Array.isArray(translations)
        ) {
          throw new Error(
            `Invalid data structure for key "${keyName}". Expected a language object.`,
          );
        }
        for (const [lang, val] of Object.entries(translations)) {
          if (
            typeof val === "string" ||
            (Array.isArray(val) && val.every((v) => typeof v === "string"))
          ) {
            locales.add(lang);
          } else {
            throw new Error(
              `Invalid value for key "${keyName}" and language "${lang}". Expected a string or array of strings.`,
            );
          }
        }
      }

      setFilePath(selected);
      setParsedData(data);
      setLocalesInData(Array.from(locales));
      setError(null);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to load JSON file.");
      setFilePath(null);
      setParsedData(null);
      setLocalesInData([]);
    }
  };

  const handleImport = () => {
    if (!parsedData) return;

    importJsonData(parsedData, localesInData, importMethod === "replace");
    onOpenChange(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setFilePath(null);
      setParsedData(null);
      setLocalesInData([]);
      setError(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content maxWidth="500px">
        <Dialog.Title>Import JSON</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Select a JSON file to import localization data.
        </Dialog.Description>

        <Flex direction="column" gap="4">
          <Flex align="center" gap="3">
            <Button onClick={handleSelectFile} variant="soft">
              Select File
            </Button>
            {filePath && (
              <Flex align="center" gap="1" style={{ overflow: "hidden" }}>
                <FileText
                  size={16}
                  color="var(--gray-9)"
                  style={{ flexShrink: 0 }}
                />
                <Text size="2" color="gray" truncate>
                  {filePath}
                </Text>
              </Flex>
            )}
          </Flex>

          {error && (
            <Callout.Root color="red" size="1">
              <Callout.Icon>
                <FileWarning size={16} />
              </Callout.Icon>
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}

          {parsedData && (
            <Flex direction="column" gap="3">
              <Text size="2" weight="bold">
                Languages Found:{" "}
                {localesInData.length > 0 ? localesInData.join(", ") : "None"}
              </Text>

              <Text size="2" weight="bold">
                Import Method:
              </Text>
              <RadioGroup.Root
                value={importMethod}
                onValueChange={(val: "replace" | "merge") =>
                  setImportMethod(val)
                }
              >
                <Flex direction="column" gap="2">
                  <Text as="label" size="2">
                    <Flex gap="2">
                      <RadioGroup.Item value="merge" /> Merge
                    </Flex>
                    <Text
                      size="1"
                      color="gray"
                      style={{ paddingLeft: "24px", display: "block" }}
                    >
                      Only fills empty fields. It does not overwrite any
                      existing data.
                    </Text>
                  </Text>
                  <Text as="label" size="2">
                    <Flex gap="2">
                      <RadioGroup.Item value="replace" /> Replace
                    </Flex>
                    <Text
                      size="1"
                      color="gray"
                      style={{ paddingLeft: "24px", display: "block" }}
                    >
                      Overwrites all existing translations for the imported
                      languages.
                    </Text>
                  </Text>
                </Flex>
              </RadioGroup.Root>
            </Flex>
          )}
        </Flex>

        <Flex gap="3" mt="5" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </Dialog.Close>
          <Button onClick={handleImport} disabled={!parsedData}>
            Import
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
