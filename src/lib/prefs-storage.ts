const STORAGE_KEY = "sf-event-match-prefs";

export type StoredPrefs = {
  categories: string[];
  neighborhoods: string[];
  keywords: string;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadStoredPrefs(): StoredPrefs | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("categories" in parsed) ||
      !Array.isArray((parsed as StoredPrefs).categories)
    ) {
      return null;
    }
    const p = parsed as StoredPrefs;
    return {
      categories: p.categories.filter((c) => typeof c === "string"),
      neighborhoods: Array.isArray(p.neighborhoods)
        ? p.neighborhoods.filter((n) => typeof n === "string")
        : [],
      keywords: typeof p.keywords === "string" ? p.keywords : "",
    };
  } catch {
    return null;
  }
}

export function saveStoredPrefs(prefs: StoredPrefs): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* quota or private mode */
  }
}
