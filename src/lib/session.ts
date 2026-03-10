const SESSION_KEY = "session";

interface SessionData {
  filePaths: Record<string, string>;
  selectedKeyName: string | null;
}

export function saveSession(
  filePaths: Map<string, string>,
  selectedKeyName: string | null,
): void {
  const data: SessionData = {
    filePaths: Object.fromEntries(filePaths),
    selectedKeyName,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function loadSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SessionData;
    if (!data.filePaths || typeof data.filePaths !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
