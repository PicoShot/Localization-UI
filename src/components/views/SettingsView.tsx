import { useEffect, useState } from "react";
import {
  Flex,
  Heading,
  Card,
  Text,
  RadioGroup,
  TextField,
  TextArea,
  Button,
  IconButton,
  Select,
  ScrollArea,
} from "@radix-ui/themes";
import { EyeOpenIcon, EyeNoneIcon, TrashIcon } from "@radix-ui/react-icons";
import { useSettingsStore } from "../../stores/settingsStore";
import { DeeplApiMode } from "../../lib/deepl";
import { GEMINI_MODELS, GeminiModel } from "../../lib/gemini";

export function SettingsView() {
  const store = useSettingsStore();
  const [showDeeplKey, setShowDeeplKey] = useState(false);
  const [localDeeplKey, setLocalDeeplKey] = useState("");
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [localGeminiKey, setLocalGeminiKey] = useState("");

  useEffect(() => {
    store.loadSettings();
  }, []);

  useEffect(() => {
    setLocalDeeplKey(store.deeplApiKey);
  }, [store.deeplApiKey]);

  useEffect(() => {
    setLocalGeminiKey(store.geminiApiKey);
  }, [store.geminiApiKey]);

  const handleSaveDeeplKey = async () => {
    await store.setDeeplApiKey(localDeeplKey);
  };

  const handleClearDeeplKey = async () => {
    await store.clearDeeplApiKey();
    setLocalDeeplKey("");
  };

  const handleSaveGeminiKey = async () => {
    await store.setGeminiApiKey(localGeminiKey);
  };

  const handleClearGeminiKey = async () => {
    await store.clearGeminiApiKey();
    setLocalGeminiKey("");
  };

  return (
    <Flex
      direction="column"
      gap="4"
      style={{ height: "100%", overflowY: "auto" }}
    >
      <Heading size="6">Settings</Heading>
      <ScrollArea>
        <Card>
          <Flex direction="column" gap="4">
            <Heading size="4">DeepL API Configuration</Heading>
            <Text size="2" color="gray">
              Configure your DeepL API settings for automatic translations.
            </Text>

            <Flex direction="column" gap="2">
              <Text size="2" weight="bold">
                API URL Mode
              </Text>
              <RadioGroup.Root
                value={store.deeplApiMode}
                onValueChange={(val) =>
                  store.setDeeplApiMode(val as DeeplApiMode)
                }
              >
                <RadioGroup.Item value="free">DeepL Free</RadioGroup.Item>
                <RadioGroup.Item value="paid">DeepL Pro (Paid)</RadioGroup.Item>
              </RadioGroup.Root>
            </Flex>

            <Flex direction="column" gap="2">
              <Text size="2" weight="bold">
                API Key
              </Text>
              <Flex gap="2" align="center">
                <TextField.Root
                  style={{ flex: 1 }}
                  type={showDeeplKey ? "text" : "password"}
                  placeholder="Enter your DeepL API key"
                  value={localDeeplKey}
                  onChange={(e) => setLocalDeeplKey(e.target.value)}
                >
                  <TextField.Slot side="right">
                    <IconButton
                      size="1"
                      variant="ghost"
                      onClick={() => setShowDeeplKey(!showDeeplKey)}
                    >
                      {showDeeplKey ? <EyeNoneIcon /> : <EyeOpenIcon />}
                    </IconButton>
                  </TextField.Slot>
                </TextField.Root>

                <Button
                  variant="soft"
                  onClick={handleSaveDeeplKey}
                  disabled={localDeeplKey === store.deeplApiKey}
                >
                  Save Key
                </Button>

                {store.deeplApiKey && (
                  <IconButton
                    color="red"
                    variant="soft"
                    onClick={handleClearDeeplKey}
                  >
                    <TrashIcon />
                  </IconButton>
                )}
              </Flex>
              <Text size="1" color="gray">
                Your API key is securely stored in your local computer using
                your OS's native Keyring/Keychain.
              </Text>
            </Flex>

            <Flex direction="column" gap="2">
              <Text size="2" weight="bold">
                Translation Context
              </Text>
              <TextArea
                placeholder="Context text to influence translations (e.g. 'This is a localization text for a video game.')"
                value={store.deeplContext}
                onChange={(e) => store.setDeeplContext(e.target.value)}
                rows={3}
              />
              <Text size="1" color="gray">
                Context text can help DeepL understand the domain and improve
                translation quality but also can highly affect translation
                results.
              </Text>
            </Flex>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="4">
            <Heading size="4">Gemini AI Configuration</Heading>
            <Text size="2" color="gray">
              Configure your Gemini AI settings for AI-powered translations.
            </Text>

            <Flex direction="column" gap="2">
              <Text size="2" weight="bold">
                Gemini AI Model
              </Text>
              <Select.Root
                value={store.geminiModel}
                onValueChange={(val) =>
                  store.setGeminiModel(val as GeminiModel)
                }
              >
                <Select.Trigger style={{ width: "100%" }} />
                <Select.Content>
                  {GEMINI_MODELS.map((m) => (
                    <Select.Item key={m} value={m}>
                      {m}
                    </Select.Item>
                  ))}
                  <Select.Separator />
                  <Select.Item value="custom">Custom</Select.Item>
                </Select.Content>
              </Select.Root>

              {store.geminiModel === "custom" && (
                <TextField.Root
                  placeholder="Enter custom model name (e.g. gemini-2.0-pro-exp)"
                  value={store.geminiCustomModel}
                  onChange={(e) => store.setGeminiCustomModel(e.target.value)}
                />
              )}
            </Flex>

            <Flex direction="column" gap="2">
              <Text size="2" weight="bold">
                API Key
              </Text>
              <Flex gap="2" align="center">
                <TextField.Root
                  style={{ flex: 1 }}
                  type={showGeminiKey ? "text" : "password"}
                  placeholder="Enter your Gemini API key"
                  value={localGeminiKey}
                  onChange={(e) => setLocalGeminiKey(e.target.value)}
                >
                  <TextField.Slot side="right">
                    <IconButton
                      size="1"
                      variant="ghost"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                    >
                      {showGeminiKey ? <EyeNoneIcon /> : <EyeOpenIcon />}
                    </IconButton>
                  </TextField.Slot>
                </TextField.Root>

                <Button
                  variant="soft"
                  onClick={handleSaveGeminiKey}
                  disabled={localGeminiKey === store.geminiApiKey}
                >
                  Save Key
                </Button>

                {store.geminiApiKey && (
                  <IconButton
                    color="red"
                    variant="soft"
                    onClick={handleClearGeminiKey}
                  >
                    <TrashIcon />
                  </IconButton>
                )}
              </Flex>
              <Text size="1" color="gray">
                Your API key is securely stored in your local computer using
                your OS's native Keyring/Keychain.
              </Text>
            </Flex>
          </Flex>
        </Card>
      </ScrollArea>
    </Flex>
  );
}
