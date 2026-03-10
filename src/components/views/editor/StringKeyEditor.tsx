import { Flex, Box, Text, TextField } from "@radix-ui/themes";
import { LocaleData } from "@/lib/bloc";
import { UnifiedKey } from "@/types/types";
import { useState } from "react";
import { RichTextEditorModal } from "./RichTextEditorModal";
import { GetLanguageName } from "@/utils/languages";

interface StringKeyEditorProps {
  locales: LocaleData[];
  selectedKey: UnifiedKey;
  onChange: (langCode: string, newValue: string) => void;
}

export function StringKeyEditor({
  locales,
  selectedKey,
  onChange,
}: StringKeyEditorProps) {
  const [editingLang, setEditingLang] = useState<string | null>(null);

  return (
    <Flex direction="column" gap="4">
      {locales.map((locale) => (
        <Box key={locale.languageCode}>
          <Text
            as="label"
            size="1"
            weight="bold"
            color="gray"
            mb="1"
            style={{ display: "block" }}
          >
            {GetLanguageName(locale.languageCode)}
          </Text>
          <TextField.Root
            value={(selectedKey.values[locale.languageCode] as string) || ""}
            onChange={(e) => onChange(locale.languageCode, e.target.value)}
            onDoubleClick={() => setEditingLang(locale.languageCode)}
            placeholder={`Value in ${GetLanguageName(locale.languageCode)}...`}
            style={{
              fontFamily: "inherit",
              cursor: "text",
            }}
          />
        </Box>
      ))}

      <RichTextEditorModal
        open={editingLang !== null}
        onOpenChange={(open) => {
          if (!open) setEditingLang(null);
        }}
        initialValue={
          editingLang ? (selectedKey.values[editingLang] as string) || "" : ""
        }
        onSave={(val) => {
          if (editingLang) {
            onChange(editingLang, val);
          }
        }}
        title={`Edit Value - ${GetLanguageName(editingLang || "")}`}
      />
    </Flex>
  );
}
