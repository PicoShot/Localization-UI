import { fetch } from "@tauri-apps/plugin-http";

export type DeeplApiMode = "paid" | "free";

export function getDeeplBaseUrl(mode: DeeplApiMode): string {
  switch (mode) {
    case "paid":
      return "https://api.deepl.com";
    case "free":
      return "https://api-free.deepl.com";
    default:
      return "https://api-free.deepl.com";
  }
}

export interface TranslateParams {
  texts: string[];
  sourceLang: string;
  targetLang: string;
  apiKey: string;
  baseUrl: string;
  context?: string;
}

export async function translateText(
  params: TranslateParams,
): Promise<string[]> {
  const { texts, sourceLang, targetLang, apiKey, baseUrl, context } = params;

  if (texts.length === 0) return [];

  const url = `${baseUrl.replace(/\/$/, "")}/v2/translate`;

  const body: any = {
    text: texts,
    source_lang: sourceLang.toUpperCase(),
    target_lang: targetLang.toUpperCase(),
  };

  if (context && context.trim() !== "") {
    body.context = context.trim();
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`DeepL API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (!data.translations || !Array.isArray(data.translations)) {
    throw new Error("Invalid response format from DeepL API");
  }

  return data.translations.map((t: any) => t.text);
}
