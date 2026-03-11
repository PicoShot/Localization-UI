import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  Button,
  Flex,
  Text,
  RadioGroup,
  Select,
  TextArea,
  Callout,
  Checkbox,
  Card,
  ScrollArea,
} from "@radix-ui/themes";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { UnifiedKey } from "@/types/types";
import { useSettingsStore } from "@/stores/settingsStore";
import { translateText } from "@/lib/gemini";
import { useEditorStore } from "@/stores/editorStore";

interface TranslateGeminiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyName: string;
  item: UnifiedKey | null;
  localeCodes: string[];
}

export function TranslateGeminiModal({
  open,
  onOpenChange,
  keyName,
  item,
  localeCodes,
}: TranslateGeminiModalProps) {
  const settings = useSettingsStore();
  const setKeyValues = useEditorStore((s) => s.setKeyValues);

  const [sourceMode, setSourceMode] = useState<"existing" | "custom">(
    "existing",
  );
  const [sourceLang, setSourceLang] = useState<string>("");
  const [customText, setCustomText] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overrideExisting, setOverrideExisting] = useState(false);

  const [selectedElements, setSelectedElements] = useState<Set<number>>(
    new Set(),
  );
  const [elementTexts, setElementTexts] = useState<Record<number, string>>({});

  const resolvedModel =
    settings.geminiModel === "custom"
      ? settings.geminiCustomModel
      : settings.geminiModel;

  const availableSourceLocales = localeCodes.filter((code) => {
    if (!item) return false;
    const val = item.values[code];
    if (!val) return false;
    if (typeof val === "string") return val.trim().length > 0;
    if (Array.isArray(val)) return val.some((v) => v.trim().length > 0);
    return false;
  });

  const arrayElementCount = useMemo(() => {
    if (!item || item.type !== "array") return 0;
    let max = 0;
    for (const val of Object.values(item.values)) {
      if (Array.isArray(val) && val.length > max) max = val.length;
    }
    return max;
  }, [item]);

  const isArrayCustom = item?.type === "array" && sourceMode === "custom";

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
      setSelectedElements(new Set());
      setElementTexts({});
    }
  }, [open, item]);

  const toggleElement = (index: number) => {
    setSelectedElements((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const setElementText = (index: number, text: string) => {
    setElementTexts((prev) => ({ ...prev, [index]: text }));
  };

  const handleTranslate = async () => {
    if (!item || !settings.geminiApiKey || !resolvedModel) return;

    setIsTranslating(true);
    setError(null);

    try {
      const targetLangs = localeCodes.filter((c) => {
        if (c === sourceLang) return false;
        if (overrideExisting) return true;

        if (item.type === "string") {
          const val = item.values[c];
          return !val || (val as string).trim() === "";
        } else {
          const existingArr = Array.isArray(item.values[c])
            ? (item.values[c] as string[])
            : [];
          if (isArrayCustom) {
            const selectedIndices = Array.from(selectedElements);
            return selectedIndices.some(
              (idx) => !existingArr[idx] || existingArr[idx].trim() === "",
            );
          } else {
            for (let i = 0; i < arrayElementCount; i++) {
              if (!existingArr[i] || existingArr[i].trim() === "") return true;
            }
            return false;
          }
        }
      });

      if (targetLangs.length === 0) {
        throw new Error(
          "All target languages already have translations. Check 'Overwrite existing translations' to replace them.",
        );
      }

      if (isArrayCustom) {
        if (selectedElements.size === 0) {
          throw new Error("Please select at least one element to translate");
        }

        const selectedIndices = Array.from(selectedElements).sort(
          (a, b) => a - b,
        );
        const textsToTranslate: string[] = [];
        for (const idx of selectedIndices) {
          const text = elementTexts[idx] || "";
          if (!text.trim()) {
            throw new Error(`Please enter text for Element ${idx}`);
          }
          textsToTranslate.push(text);
        }

        const newValues: Record<string, string | string[] | null | undefined> =
          { ...item.values };

        const sourceArr = Array.isArray(newValues[sourceLang])
          ? [...(newValues[sourceLang] as string[])]
          : [];
        while (sourceArr.length < arrayElementCount) {
          sourceArr.push("");
        }
        selectedIndices.forEach((elementIdx, i) => {
          sourceArr[elementIdx] = textsToTranslate[i];
        });
        newValues[sourceLang] = sourceArr;

        const batchResult = await translateText({
          texts: textsToTranslate,
          sourceLang,
          targetLangs,
          apiKey: settings.geminiApiKey,
          model: resolvedModel,
        });

        for (const targetLang of targetLangs) {
          const translatedTexts = batchResult[targetLang] || [];
          const existingArr = Array.isArray(newValues[targetLang])
            ? [...(newValues[targetLang] as string[])]
            : [];

          while (existingArr.length < arrayElementCount) {
            existingArr.push("");
          }

          selectedIndices.forEach((elementIdx, translationIdx) => {
            if (
              overrideExisting ||
              !existingArr[elementIdx] ||
              existingArr[elementIdx].trim() === ""
            ) {
              existingArr[elementIdx] = translatedTexts[translationIdx] || "";
            }
          });

          newValues[targetLang] = existingArr;
        }

        setKeyValues(keyName, newValues);
        onOpenChange(false);
        return;
      }

      let textsToTranslate: string[] = [];
      if (sourceMode === "custom") {
        if (!customText.trim()) {
          throw new Error("Please enter custom text to translate");
        }
        textsToTranslate = [customText];
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

      const newValues: Record<string, string | string[] | null | undefined> = {
        ...item.values,
      };

      const batchResult = await translateText({
        texts: textsToTranslate,
        sourceLang,
        targetLangs,
        apiKey: settings.geminiApiKey,
        model: resolvedModel,
      });

      for (const targetLang of targetLangs) {
        const translatedTexts = batchResult[targetLang] || [];
        if (item.type === "string") {
          const currentVal = newValues[targetLang] as string | undefined;
          if (overrideExisting || !currentVal || currentVal.trim() === "") {
            newValues[targetLang] = translatedTexts[0] || "";
          }
        } else {
          const existingArr = Array.isArray(newValues[targetLang])
            ? [...(newValues[targetLang] as string[])]
            : [];

          while (existingArr.length < arrayElementCount) {
            existingArr.push("");
          }

          translatedTexts.forEach((text, i) => {
            if (
              overrideExisting ||
              !existingArr[i] ||
              existingArr[i].trim() === ""
            ) {
              existingArr[i] = text;
            }
          });
          newValues[targetLang] = existingArr;
        }
      }

      if (sourceMode === "custom") {
        if (item.type === "string") {
          newValues[sourceLang] = customText;
        } else {
          newValues[sourceLang] = textsToTranslate;
        }
      }

      setKeyValues(keyName, newValues);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred during translation");
    } finally {
      setIsTranslating(false);
    }
  };

  const hasApiKey = Boolean(settings.geminiApiKey);
  const hasModel = Boolean(resolvedModel);

  const canTranslate = useMemo(() => {
    if (!hasApiKey || !hasModel || isTranslating) return false;
    if (isArrayCustom) {
      if (selectedElements.size === 0) return false;
      return Array.from(selectedElements).every(
        (idx) => (elementTexts[idx] || "").trim().length > 0,
      );
    }
    if (sourceMode === "existing") return Boolean(sourceLang);
    return Boolean(customText.trim());
  }, [
    hasApiKey,
    hasModel,
    isTranslating,
    isArrayCustom,
    selectedElements,
    elementTexts,
    sourceMode,
    sourceLang,
    customText,
  ]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 500 }}>
        <Dialog.Title>Translate with Gemini</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Translate <Text weight="bold">{keyName}</Text> into all other
          languages using <Text weight="bold">{resolvedModel || "Gemini"}</Text>
          .
        </Dialog.Description>

        {!hasApiKey && (
          <Callout.Root color="amber" mb="4">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              Please configure your Gemini API key in Settings first.
            </Callout.Text>
          </Callout.Root>
        )}

        {hasApiKey && !hasModel && (
          <Callout.Root color="amber" mb="4">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              Please enter a custom model name in Settings.
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
            disabled={!hasApiKey || !hasModel || isTranslating}
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

                    {item?.type === "array" ? (
                      <Flex direction="column" gap="2">
                        <Text size="1" color="gray">
                          Select elements to translate and enter source text for
                          each:
                        </Text>
                        <ScrollArea
                          scrollbars="vertical"
                          style={{ maxHeight: 300 }}
                        >
                          <Flex direction="column" gap="2" pr="3">
                            {Array.from({ length: arrayElementCount }).map(
                              (_, i) => (
                                <Card key={i} size="1" variant="surface">
                                  <Flex direction="column" gap="2">
                                    <Text
                                      as="label"
                                      size="2"
                                      style={{ cursor: "pointer" }}
                                    >
                                      <Flex gap="2" align="center">
                                        <Checkbox
                                          checked={selectedElements.has(i)}
                                          onCheckedChange={() =>
                                            toggleElement(i)
                                          }
                                          disabled={isTranslating}
                                        />
                                        Element {i}
                                      </Flex>
                                    </Text>
                                    {selectedElements.has(i) && (
                                      <TextArea
                                        placeholder={`Source text for Element ${i}`}
                                        value={elementTexts[i] || ""}
                                        onChange={(e) =>
                                          setElementText(i, e.target.value)
                                        }
                                        disabled={isTranslating}
                                        rows={2}
                                      />
                                    )}
                                  </Flex>
                                </Card>
                              ),
                            )}
                          </Flex>
                        </ScrollArea>
                      </Flex>
                    ) : (
                      <TextArea
                        placeholder="Enter text to translate"
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        disabled={isTranslating}
                        rows={4}
                      />
                    )}
                  </Flex>
                </Box>
              )}
            </Flex>
          </RadioGroup.Root>

          <Flex mt="2">
            <Text as="label" size="2">
              <Flex gap="2" align="center">
                <Checkbox
                  checked={overrideExisting}
                  onCheckedChange={(checked) =>
                    setOverrideExisting(Boolean(checked))
                  }
                  disabled={isTranslating}
                />
                Overwrite existing translations
              </Flex>
            </Text>
          </Flex>
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
