export const ARTIST_NAME = "李志";
export const FALLBACK_COVER =
  "https://cdn.jsdelivr.net/gh/nj-lizhi/song@main/audio/F/cover.png";

export function getListData(source) {
  try {
    const parsed = Function(`${source}; return list;`)();
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function normalizeTracks(rawTracks) {
  return rawTracks.map((track, index) => {
    const albumName = String(track.artist || "未知专辑").replace(/^专辑-/, "");
    return {
      ...track,
      url: normalizeUrl(track.url),
      cover: normalizeUrl(track.cover),
      id: `${albumName}-${index}-${track.name}`,
      albumName,
      displayArtist: ARTIST_NAME,
    };
  });
}

function normalizeUrl(url) {
  return String(url || "").replace(
    "https://testingcf.jsdelivr.net/",
    "https://cdn.jsdelivr.net/"
  );
}

export function buildAlbums(tracks) {
  const map = new Map();
  tracks.forEach((track) => {
    if (!map.has(track.albumName)) {
      map.set(track.albumName, {
        id: track.albumName,
        name: track.albumName,
        cover: track.cover,
        tracks: [],
      });
    }
    map.get(track.albumName).tracks.push(track);
  });
  return Array.from(map.values());
}

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
