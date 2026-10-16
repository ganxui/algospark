// Browser storage may be unavailable (private mode, blocked cookies or full quota).
export const storage = {
  getItem(key) { try { return localStorage.getItem(key); } catch { return null; } },
  setItem(key, value) { try { localStorage.setItem(key, String(value)); } catch {} },
  removeItem(key) { try { localStorage.removeItem(key); } catch {} }
};

export function readJson(key, fallback) {
  try { return JSON.parse(storage.getItem(key)) ?? fallback; } catch { return fallback; }
}

export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
