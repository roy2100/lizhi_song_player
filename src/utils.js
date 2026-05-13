export const ARTIST_NAME = "李志";
export const FALLBACK_COVER =
  "https://cdn.jsdelivr.net/gh/nj-lizhi/song@main/audio/F/cover.png";

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function pickRandom(items, avoidId) {
  if (!items.length) return null;
  if (items.length === 1) return items[0];
  const pool = items.filter((t) => t.id !== avoidId);
  return pool[Math.floor(Math.random() * pool.length)];
}

export const PLAY_COUNTS_KEY = "lizhi_play_counts";

export function loadPlayCounts() {
  try {
    const raw = localStorage.getItem(PLAY_COUNTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

export function savePlayCounts(counts) {
  try {
    localStorage.setItem(PLAY_COUNTS_KEY, JSON.stringify(counts));
  } catch {}
}
