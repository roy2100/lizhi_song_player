export const ARTIST_NAME = "李志";
export const FALLBACK_COVER =
  "https://raw.githubusercontent.com/roy2100/lizhi_song_player/v1.2-aac/audio/F/cover.webp";

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

export function normalizeAlbums(rawAlbums) {
  return rawAlbums.map((album) => ({
    ...album,
    tracks: album.tracks.map((t) => ({
      id: `${album.name}/${t.name}`,
      name: t.name,
      url: t.url,
      duration: t.duration,
      albumName: album.name,
      cover: album.cover,
      artist: ARTIST_NAME,
    })),
  }));
}

export function sortAlbumsByYear(albums) {
  return [...albums].sort((a, b) => {
    if (a.year && b.year) return b.year - a.year;
    if (a.year) return -1;
    if (b.year) return 1;
    return 0;
  });
}
