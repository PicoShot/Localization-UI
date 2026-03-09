import { Flex, Box, Text, TextField } from "@radix-ui/themes";
import { LocaleData } from "../../../lib/bloc";
import { UnifiedKey } from "./types";

interface StringKeyEditorProps {
  data: LocaleData[];
  selectedKey: UnifiedKey;
  onChange: (langCode: string, newValue: string) => void;
}

export function StringKeyEditor({
  data,
  selectedKey,
  onChange,
}: StringKeyEditorProps) {
  return (
    <Flex direction="column" gap="4">
      {data.map((locale) => (
        <Box key={locale.languageCode}>
          <Text
            as="label"
            size="1"
            weight="bold"
            color="gray"
            mb="1"
            style={{ display: "block" }}
          >
            {locale.languageCode.toUpperCase()}
          </Text>
          <TextField.Root
            value={(selectedKey.values[locale.languageCode] as string) || ""}
            onChange={(e) => onChange(locale.languageCode, e.target.value)}
            placeholder={`Value in ${locale.languageCode}...`}
            style={{
              fontFamily: "inherit",
            }}
          />
        </Box>
      ))}
    </Flex>
  );
}
