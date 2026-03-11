import { useState, useEffect } from "react";
import {
  Dialog,
  Button,
  Flex,
  Text,
  RadioGroup,
  Select,
  TextArea,
  Callout,
} from "@radix-ui/themes";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { UnifiedKey } from "@/types/types";
import { useSettingsStore } from "@/stores/settingsStore";
import { translateText, getDeeplBaseUrl } from "@/lib/deepl";
import { useEditorStore } from "@/stores/editorStore";

interface TranslateDeeplModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyName: string;
  item: UnifiedKey | null;
  localeCodes: string[];
}

export function TranslateDeeplModal({
  open,
  onOpenChange,
  keyName,
  item,
  localeCodes,
}: TranslateDeeplModalProps) {
  const settings = useSettingsStore();
  const setKeyValues = useEditorStore((s) => s.setKeyValues);

  const [sourceMode, setSourceMode] = useState<"existing" | "custom">(
    "existing",
  );
  const [sourceLang, setSourceLang] = useState<string>("");
  const [customText, setCustomText] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableSourceLocales = localeCodes.filter((code) => {
    if (!item) return false;
    const val = item.values[code];
    if (!val) return false;
    if (typeof val === "string") return val.trim().length > 0;
    if (Array.isArray(val)) return val.some((v) => v.trim().length > 0);
    return false;
  });

  useEffect(() => {
    if (open && item) {
      if (availableSourceLocales.length > 0) {
        setSourceMode("existing");
        setSourceLang(availableSourceLocales[0]);
      } else {
        setSourceMode("custom");
        setSourceLang("en");
      }
      setCustomText("");
      setError(null);
    }
  }, [open, item]);

  const handleTranslate = async () => {
    if (!item || !settings.deeplApiKey) return;

    setIsTranslating(true);
    setError(null);

    try {
      const baseUrl = getDeeplBaseUrl(settings.deeplApiMode);

      let textsToTranslate: string[] = [];
      if (sourceMode === "custom") {
        if (!customText.trim())
          throw new Error("Please enter custom text to translate");
        textsToTranslate = [customText];
        if (item.type === "array") {
          textsToTranslate = customText
            .split("\n")
            .filter((t) => t.trim().length > 0);
        }
      } else {
        const val = item.values[sourceLang];
        if (typeof val === "string") {
          textsToTranslate = [val];
        } else if (Array.isArray(val)) {
          textsToTranslate = val;
        }
      }

      if (textsToTranslate.length === 0) {
        throw new Error("No text to translate");
      }

      const targetLangs = localeCodes.filter((c) => c !== sourceLang);

      if (targetLangs.length === 0) {
        throw new Error("No target languages to translate to");
      }

      const newValues: Record<string, string | string[] | null | undefined> = {
        ...item.values,
      };

      await Promise.all(
        targetLangs.map(async (targetLang) => {
          try {
            const translatedTexts = await translateText({
              texts: textsToTranslate,
              sourceLang: sourceLang,
              targetLang: targetLang,
              apiKey: settings.deeplApiKey,
              baseUrl: baseUrl,
              context: settings.deeplContext,
            });

            if (item.type === "string") {
              newValues[targetLang] = translatedTexts[0] || "";
            } else {
              newValues[targetLang] = translatedTexts;
            }
          } catch (err: any) {
            console.error(`Failed to translate to ${targetLang}:`, err);
            throw new Error(
              `Failed to translate to ${targetLang}: ${err.message}`,
            );
          }
        }),
      );

      setKeyValues(keyName, newValues);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred during translation");
    } finally {
      setIsTranslating(false);
    }
  };

  const hasApiKey = Boolean(settings.deeplApiKey);
  const canTranslate =
    hasApiKey &&
    !isTranslating &&
    (sourceMode === "existing"
      ? Boolean(sourceLang)
      : Boolean(customText.trim()));

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>Translate with DeepL</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Translate <Text weight="bold">{keyName}</Text> into all other
          languages.
        </Dialog.Description>

        {!hasApiKey && (
          <Callout.Root color="amber" mb="4">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              Please configure your DeepL API key in Settings first.
            </Callout.Text>
          </Callout.Root>
        )}

        {error && (
          <Callout.Root color="red" mb="4">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <Flex direction="column" gap="4">
          <RadioGroup.Root
            value={sourceMode}
            onValueChange={(val: any) => setSourceMode(val)}
            disabled={!hasApiKey || isTranslating}
          >
            <Flex direction="column" gap="3">
              <Text as="label" size="2">
                <Flex gap="2" align="center">
                  <RadioGroup.Item
                    value="existing"
                    disabled={availableSourceLocales.length === 0}
                  />
                  Use existing language as source
                </Flex>
              </Text>

              {sourceMode === "existing" && (
                <Box pl="4">
                  <Select.Root
                    value={sourceLang}
                    onValueChange={setSourceLang}
                    disabled={isTranslating}
                  >
                    <Select.Trigger
                      placeholder="Select source language"
                      style={{ width: "100%" }}
                    />
                    <Select.Content>
                      {availableSourceLocales.map((code) => (
                        <Select.Item key={code} value={code}>
                          {code.toUpperCase()}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Box>
              )}

              <Text as="label" size="2">
                <Flex gap="2" align="center">
                  <RadioGroup.Item value="custom" />
                  Enter custom source text
                </Flex>
              </Text>

              {sourceMode === "custom" && (
                <Box pl="4">
                  <Flex direction="column" gap="2">
                    <Select.Root
                      value={sourceLang}
                      onValueChange={setSourceLang}
                      disabled={isTranslating}
                    >
                      <Select.Trigger
                        placeholder="Source language"
                        style={{ width: "100%" }}
                      />
                      <Select.Content>
                        {localeCodes.map((code) => (
                          <Select.Item key={code} value={code}>
                            {code.toUpperCase()}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                    <TextArea
                      placeholder={
                        item?.type === "array"
                          ? "Enter texts (one per line)"
                          : "Enter text to translate"
                      }
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      disabled={isTranslating}
                      rows={4}
                    />
                  </Flex>
                </Box>
              )}
            </Flex>
          </RadioGroup.Root>
        </Flex>

        <Flex gap="3" mt="5" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray" disabled={isTranslating}>
              Cancel
            </Button>
          </Dialog.Close>
          <Button onClick={handleTranslate} disabled={!canTranslate}>
            {isTranslating ? "Translating..." : "Translate"}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

function Box({ children, pl }: { children: React.ReactNode; pl?: string }) {
  return (
    <div style={{ paddingLeft: pl ? `var(--space-${pl})` : undefined }}>
      {children}
    </div>
  );
}
