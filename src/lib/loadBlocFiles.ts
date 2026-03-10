import { LocaleBlocSerializer, LocaleData } from "@/lib/bloc";
import { readFile, readDir } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";

interface BlocFile {
  buffer: Uint8Array;
  path: string;
}

async function readBlocFilesFromPaths(paths: string[]): Promise<BlocFile[]> {
  const results: BlocFile[] = [];
  for (const p of paths) {
    if (p.endsWith(".bloc")) {
      try {
        const buf = await readFile(p);
        results.push({ buffer: buf, path: p });
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        const entries = await readDir(p);
        const subPaths: string[] = [];
        for (const entry of entries) {
          if (entry.isDirectory || entry.name.endsWith(".bloc")) {
            subPaths.push(await join(p, entry.name));
          }
        }
        if (subPaths.length > 0) {
          const subResults = await readBlocFilesFromPaths(subPaths);
          results.push(...subResults);
        }
      } catch (err) {
        console.error(err);
      }
    }
  }
  return results;
}

export async function loadBlocFilesFromPaths(
  paths: string[],
): Promise<{ locales: LocaleData[]; filePaths: Map<string, string> }> {
  const blocFiles = await readBlocFilesFromPaths(paths);
  const locales: LocaleData[] = [];
  const filePaths = new Map<string, string>();

  for (const { buffer, path } of blocFiles) {
    const validation = LocaleBlocSerializer.validateBuffer(buffer);
    if (validation.isValid && validation.languageCode) {
      locales.push(LocaleBlocSerializer.deserialize(buffer));
      filePaths.set(validation.languageCode, path);
    }
  }

  return { locales, filePaths };
}
