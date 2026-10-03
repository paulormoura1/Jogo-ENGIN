export function readStoredArray<T>(key: string, valid: (item: any) => boolean): T[] {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data.filter(item => item && valid(item)) : [];
  } catch { return []; }
}

export function writeStored(key: string, value: unknown): boolean {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}
