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
} from "@radix-ui/themes";
import { EyeOpenIcon, EyeNoneIcon, TrashIcon } from "@radix-ui/react-icons";
import { useSettingsStore } from "../../stores/settingsStore";
import { DeeplApiMode } from "../../lib/deepl";

export function SettingsView() {
  const store = useSettingsStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [localApiKey, setLocalApiKey] = useState("");

  useEffect(() => {
    store.loadSettings();
  }, []);

  useEffect(() => {
    setLocalApiKey(store.deeplApiKey);
  }, [store.deeplApiKey]);

  const handleSaveApiKey = async () => {
    await store.setDeeplApiKey(localApiKey);
  };

  const handleClearApiKey = async () => {
    await store.clearDeeplApiKey();
    setLocalApiKey("");
  };

  return (
    <Flex
      direction="column"
      gap="4"
      style={{ height: "100%", overflowY: "auto" }}
    >
      <Heading size="6">Settings</Heading>

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
                type={showApiKey ? "text" : "password"}
                placeholder="Enter your DeepL API key"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
              >
                <TextField.Slot side="right">
                  <IconButton
                    size="1"
                    variant="ghost"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeNoneIcon /> : <EyeOpenIcon />}
                  </IconButton>
                </TextField.Slot>
              </TextField.Root>

              <Button
                variant="soft"
                onClick={handleSaveApiKey}
                disabled={localApiKey === store.deeplApiKey}
              >
                Save Key
              </Button>

              {store.deeplApiKey && (
                <IconButton
                  color="red"
                  variant="soft"
                  onClick={handleClearApiKey}
                >
                  <TrashIcon />
                </IconButton>
              )}
            </Flex>
            <Text size="1" color="gray">
              Your API key is securely stored in your local computer using your
              OS's native Keyring/Keychain.
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
    </Flex>
  );
}
