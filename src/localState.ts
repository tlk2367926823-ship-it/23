import type { MockAsset, ShareDraft } from "./types";

const STORAGE_KEY = "huizhi-redbook-share-state";

export interface SavedShareState {
  draft: ShareDraft | null;
  asset: MockAsset | null;
  claimCode: string;
  publishedAt: string;
}

const emptyState: SavedShareState = {
  draft: null,
  asset: null,
  claimCode: "",
  publishedAt: "",
};

export function loadSavedShareState(): SavedShareState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;
    return { ...emptyState, ...JSON.parse(raw) };
  } catch {
    return emptyState;
  }
}

export function saveShareState(nextState: Partial<SavedShareState>) {
  const current = loadSavedShareState();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...nextState }));
}

export function clearShareState() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function createClaimCode(source: string) {
  const now = new Date();
  const stamp = [
    String(now.getFullYear()).slice(-2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
  ].join("");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HZ-${source.toUpperCase()}-${stamp}-${suffix}`;
}
