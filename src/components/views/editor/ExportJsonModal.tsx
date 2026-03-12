import { useState, useMemo } from "react";
import {
  Dialog,
  Button,
  Flex,
  Text,
  Checkbox,
  ScrollArea,
} from "@radix-ui/themes";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { useEditorStore } from "@/stores/editorStore";
import { GetLanguageName } from "@/utils/languages";

interface ExportJsonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportJsonModal({ open, onOpenChange }: ExportJsonModalProps) {
  const keys = useEditorStore((s) => s.keys);
  const locales = useEditorStore((s) => s.locales);
  const localeCodes = useMemo(
    () => locales.map((l) => l.languageCode),
    [locales],
  );

  const [selectedLocales, setSelectedLocales] = useState<Set<string>>(
    new Set(localeCodes),
  );

  const handleToggle = (code: string) => {
    const next = new Set(selectedLocales);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setSelectedLocales(next);
  };

  const handleToggleAll = () => {
    if (selectedLocales.size === localeCodes.length) {
      setSelectedLocales(new Set());
    } else {
      setSelectedLocales(new Set(localeCodes));
    }
  };

  const handleExport = async () => {
    if (selectedLocales.size === 0) return;

    try {
      const filePath = await save({
        filters: [
          {
            name: "JSON",
            extensions: ["json"],
          },
        ],
        title: "Export Localization Data",
        defaultPath: `exported-localization.${Date.now()}.json`,
      });

      if (!filePath) return;

      const exportData: Record<string, Record<string, string | string[]>> = {};

      for (const key of keys) {
        exportData[key.name] = {};
        for (const lang of selectedLocales) {
          const val = key.values[lang];
          if (val !== undefined && val !== null) {
            exportData[key.name][lang] = val;
          } else {
            exportData[key.name][lang] = key.type === "array" ? [] : "";
          }
        }
      }

      const jsonStr = JSON.stringify(exportData, null, 2);

      const encoder = new TextEncoder();
      await writeFile(filePath, encoder.encode(jsonStr));

      onOpenChange(false);
    } catch (e) {
      console.error("Failed to export JSON:", e);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="400px">
        <Dialog.Title>Export JSON</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Select the languages to include in the export.
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <Flex align="center" gap="2">
            <Checkbox
              checked={
                selectedLocales.size > 0 &&
                selectedLocales.size === localeCodes.length
              }
              onCheckedChange={handleToggleAll}
            />
            <Text weight="bold" size="2">
              Select All
            </Text>
          </Flex>

          <ScrollArea type="auto" style={{ maxHeight: "250px" }}>
            <Flex direction="column" gap="2" pl="2" pr="3">
              {localeCodes.map((code) => (
                <Text
                  as="label"
                  size="2"
                  key={code}
                  style={{ cursor: "pointer" }}
                >
                  <Flex gap="2">
                    <Checkbox
                      checked={selectedLocales.has(code)}
                      onCheckedChange={() => handleToggle(code)}
                    />{" "}
                    {GetLanguageName(code)}
                  </Flex>
                </Text>
              ))}
            </Flex>
          </ScrollArea>
        </Flex>

        <Flex gap="3" mt="5" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </Dialog.Close>
          <Button onClick={handleExport} disabled={selectedLocales.size === 0}>
            Export
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
