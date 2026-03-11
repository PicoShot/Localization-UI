import { fetch } from "@tauri-apps/plugin-http";

export const GEMINI_MODELS = [
  "gemini-3.1-flash-lite-preview",
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
] as const;

export type GeminiModel = (typeof GEMINI_MODELS)[number] | "custom";

export interface GeminiTranslateParams {
  texts: string[];
  sourceLang: string;
  targetLangs: string[];
  apiKey: string;
  model: string;
}

export async function translateText(
  params: GeminiTranslateParams,
): Promise<Record<string, string[]>> {
  const { texts, sourceLang, targetLangs, apiKey, model } = params;

  if (texts.length === 0 || targetLangs.length === 0) return {};

  const prompt = [
    `Translate the following ${texts.length} text(s) from "${sourceLang}" to these languages: ${targetLangs.map((l) => `"${l}"`).join(", ")}.`,
    `Treat any text enclosed in curly braces like {0}, {1}, etc. as placeholders. Do NOT translate them, modify them, or remove them. Ensure they are correctly placed within the translated text without altering their original format.`,
    `Return ONLY a JSON object where each key is a target language code and each value is an array of ${texts.length} translated string(s) in the same order as the input.`,
    `No extra keys, markdown, or explanation.`,
    ``,
    `Input:`,
    JSON.stringify(texts),
  ].join("\n");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    console.error("Gemini API error:", response.status, errorText);
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  const candidate = data.candidates?.[0];
  if (!candidate?.content?.parts?.[0]?.text) {
    console.error("Invalid response format from Gemini API:", data);
    throw new Error("Invalid response format from Gemini API");
  }

  const raw = candidate.content.parts[0].text.trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e: unknown) {
    console.error("Failed to parse Gemini response as JSON:", raw, e);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    console.error("Expected JSON object from Gemini API, got:", raw);
    throw new Error(`Expected JSON object from Gemini API, got: ${raw}`);
  }

  const result: Record<string, string[]> = {};
  for (const lang of targetLangs) {
    const translations = (parsed as Record<string, unknown>)[lang];
    if (!Array.isArray(translations) || translations.length !== texts.length) {
      console.error(`Missing or invalid translations for "${lang}":`, raw);
      throw new Error(
        `Missing or invalid translations for "${lang}" in Gemini response`,
      );
    }
    result[lang] = translations.map((v: unknown) => String(v));
  }

  return result;
}
