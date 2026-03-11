import {
  setPassword,
  getPassword,
  deletePassword,
} from "tauri-plugin-keyring-api";

const SERVICE_NAME = "com.picoshot.localization";

export enum KeyringType {
  DEEPL = "deepl-api-key",
}

export async function saveApiKey(
  type: KeyringType,
  key: string,
): Promise<void> {
  try {
    await setPassword(SERVICE_NAME, type, key);
  } catch (err) {
    console.error("Failed to save API key to Keyring:", err);
  }
}

export async function loadApiKey(type: KeyringType): Promise<string | null> {
  try {
    const key = await getPassword(SERVICE_NAME, type);
    return key;
  } catch (err) {
    return null;
  }
}

export async function clearApiKey(type: KeyringType): Promise<void> {
  try {
    await deletePassword(SERVICE_NAME, type);
  } catch (err) {
    console.error("Failed to clear API key from Keyring:", err);
  }
}
