import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  computeChartTracks,
  formatTime,
  loadPlayCounts,
  normalizeAlbums,
  pickRandom,
  PLAY_COUNTS_KEY,
  savePlayCounts,
  selectNextTrack,
  selectPreviousTrack,
  sortAlbumsByYear,
} from "./utils";

describe("formatTime", () => {
  it("formats whole minutes", () => {
    expect(formatTime(60)).toBe("1:00");
    expect(formatTime(120)).toBe("2:00");
  });

  it("pads seconds below 10", () => {
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(9)).toBe("0:09");
  });

  it("truncates decimal seconds", () => {
    expect(formatTime(90.9)).toBe("1:30");
  });

  it("returns placeholder for non-positive values", () => {
    expect(formatTime(0)).toBe("--:--");
    expect(formatTime(-1)).toBe("--:--");
  });

  it("returns placeholder for non-finite values", () => {
    expect(formatTime(NaN)).toBe("--:--");
    expect(formatTime(Infinity)).toBe("--:--");
  });
});

describe("pickRandom", () => {
  it("returns null for empty array", () => {
    expect(pickRandom([])).toBeNull();
  });

  it("returns the only item in a single-element array", () => {
    const item = { id: "a" };
    expect(pickRandom([item])).toBe(item);
  });

  it("avoids item with avoidId", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
    for (let i = 0; i < 20; i++) {
      const result = pickRandom(items, "a");
      expect(result.id).not.toBe("a");
    }
  });

  it("picks from all items when avoidId is absent", () => {
    const items = [{ id: "a" }, { id: "b" }];
    const seen = new Set();
    for (let i = 0; i < 50; i++) {
      seen.add(pickRandom(items).id);
    }
    expect(seen.has("a")).toBe(true);
    expect(seen.has("b")).toBe(true);
  });
});

describe("loadPlayCounts", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty object when nothing stored", () => {
    expect(loadPlayCounts()).toEqual({});
  });

  it("returns stored counts", () => {
    localStorage.setItem(PLAY_COUNTS_KEY, JSON.stringify({ "song-1": 3 }));
    expect(loadPlayCounts()).toEqual({ "song-1": 3 });
  });

  it("returns empty object for invalid JSON", () => {
    localStorage.setItem(PLAY_COUNTS_KEY, "not-json");
    expect(loadPlayCounts()).toEqual({});
  });

  it("returns empty object when stored value is an array", () => {
    localStorage.setItem(PLAY_COUNTS_KEY, JSON.stringify([1, 2, 3]));
    expect(loadPlayCounts()).toEqual({});
  });

  it("returns empty object when stored value is null", () => {
    localStorage.setItem(PLAY_COUNTS_KEY, "null");
    expect(loadPlayCounts()).toEqual({});
  });
});

describe("savePlayCounts", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists counts to localStorage", () => {
    savePlayCounts({ "song-1": 5, "song-2": 2 });
    expect(localStorage.getItem(PLAY_COUNTS_KEY)).toBe(
      JSON.stringify({ "song-1": 5, "song-2": 2 })
    );
  });

  it("round-trips through loadPlayCounts", () => {
    const counts = { "track-a": 10, "track-b": 1 };
    savePlayCounts(counts);
    expect(loadPlayCounts()).toEqual(counts);
  });

  it("does not throw when localStorage is unavailable", () => {
    const original = localStorage.setItem.bind(localStorage);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => savePlayCounts({ x: 1 })).not.toThrow();
    vi.restoreAllMocks();
  });
});

describe("normalizeAlbums", () => {
  const raw = [
    {
      name: "测试专辑",
      cover: "https://example.com/cover.png",
      year: 2018,
      tracks: [
        { name: "歌曲A", url: "https://example.com/a.m4a", duration: 180 },
        { name: "歌曲B", url: "https://example.com/b.m4a", duration: 240 },
      ],
    },
  ];

  it("derives track id from album name and track name", () => {
    const [album] = normalizeAlbums(raw);
    expect(album.tracks[0].id).toBe("测试专辑/歌曲A");
    expect(album.tracks[1].id).toBe("测试专辑/歌曲B");
  });

  it("sets albumName and cover from parent album", () => {
    const [album] = normalizeAlbums(raw);
    album.tracks.forEach((t) => {
      expect(t.albumName).toBe("测试专辑");
      expect(t.cover).toBe("https://example.com/cover.png");
    });
  });

  it("sets artist to 李志 for every track", () => {
    const [album] = normalizeAlbums(raw);
    album.tracks.forEach((t) => expect(t.artist).toBe("李志"));
  });

  it("preserves duration, name and url", () => {
    const [album] = normalizeAlbums(raw);
    expect(album.tracks[0].duration).toBe(180);
    expect(album.tracks[0].name).toBe("歌曲A");
    expect(album.tracks[0].url).toBe("https://example.com/a.m4a");
  });

  it("preserves album-level fields (year, cover)", () => {
    const [album] = normalizeAlbums(raw);
    expect(album.year).toBe(2018);
    expect(album.cover).toBe("https://example.com/cover.png");
  });

  it("handles multiple albums independently", () => {
    const twoAlbums = [
      { name: "A", cover: "", tracks: [{ name: "x", url: "", duration: 1 }] },
      { name: "B", cover: "", tracks: [{ name: "y", url: "", duration: 2 }] },
    ];
    const result = normalizeAlbums(twoAlbums);
    expect(result[0].tracks[0].id).toBe("A/x");
    expect(result[1].tracks[0].id).toBe("B/y");
  });
});

describe("computeChartTracks", () => {
  const tracks = [
    { id: "a/1", name: "歌1" },
    { id: "a/2", name: "歌2" },
    { id: "b/1", name: "歌3" },
    { id: "b/2", name: "歌4" },
  ];
  const featured = { name: "a", tracks: [tracks[0], tracks[1]] };

  it("sorts tracks with plays by count desc, ignores unplayed", () => {
    const chart = computeChartTracks(tracks, { "a/1": 2, "b/2": 5 }, featured);
    expect(chart.map((t) => t.id)).toEqual(["b/2", "a/1"]);
  });

  it("respects limit", () => {
    const counts = { "a/1": 4, "a/2": 3, "b/1": 2, "b/2": 1 };
    const chart = computeChartTracks(tracks, counts, featured, 2);
    expect(chart.map((t) => t.id)).toEqual(["a/1", "a/2"]);
  });

  it("falls back to featured album tracks when nothing has been played", () => {
    const chart = computeChartTracks(tracks, {}, featured);
    expect(chart).toEqual(featured.tracks);
  });

  it("falls back to all tracks when no featured album given", () => {
    const chart = computeChartTracks(tracks, {}, null);
    expect(chart).toEqual(tracks);
  });

  it("excludes tracks whose play count is zero", () => {
    const chart = computeChartTracks(tracks, { "a/1": 0, "b/1": 1 }, featured);
    expect(chart.map((t) => t.id)).toEqual(["b/1"]);
  });
});

describe("selectNextTrack", () => {
  const queue = [{ id: "1" }, { id: "2" }, { id: "3" }];

  it("returns next track in sequence", () => {
    const next = selectNextTrack({
      queue,
      currentTrackId: "1",
      isShuffle: false,
      repeatMode: "all",
    });
    expect(next.id).toBe("2");
  });

  it("wraps to first when at end and repeatMode=all", () => {
    const next = selectNextTrack({
      queue,
      currentTrackId: "3",
      isShuffle: false,
      repeatMode: "all",
    });
    expect(next.id).toBe("1");
  });

  it("returns null at end when repeatMode=off and not shuffling", () => {
    const next = selectNextTrack({
      queue,
      currentTrackId: "3",
      isShuffle: false,
      repeatMode: "off",
    });
    expect(next).toBeNull();
  });

  it("picks random non-current track when isShuffle", () => {
    for (let i = 0; i < 20; i++) {
      const next = selectNextTrack({
        queue,
        currentTrackId: "2",
        isShuffle: true,
        repeatMode: "off",
      });
      expect(next.id).not.toBe("2");
    }
  });

  it("returns null for empty queue", () => {
    expect(
      selectNextTrack({ queue: [], currentTrackId: "x", isShuffle: false, repeatMode: "all" })
    ).toBeNull();
  });
});

describe("selectPreviousTrack", () => {
  const queue = [{ id: "1" }, { id: "2" }, { id: "3" }];

  it("returns previous track", () => {
    expect(selectPreviousTrack({ queue, currentTrackId: "2" }).id).toBe("1");
  });

  it("wraps to last when at first", () => {
    expect(selectPreviousTrack({ queue, currentTrackId: "1" }).id).toBe("3");
  });

  it("returns null for empty queue", () => {
    expect(selectPreviousTrack({ queue: [], currentTrackId: "x" })).toBeNull();
  });
});

describe("sortAlbumsByYear", () => {
  it("sorts by year descending", () => {
    const albums = [{ name: "A", year: 2010 }, { name: "B", year: 2018 }, { name: "C", year: 2014 }];
    const sorted = sortAlbumsByYear(albums);
    expect(sorted.map((a) => a.year)).toEqual([2018, 2014, 2010]);
  });

  it("puts albums without year after those with year", () => {
    const albums = [{ name: "X" }, { name: "Y", year: 2015 }, { name: "Z" }];
    const sorted = sortAlbumsByYear(albums);
    expect(sorted[0].year).toBe(2015);
    expect(sorted[1].year).toBeUndefined();
    expect(sorted[2].year).toBeUndefined();
  });

  it("does not mutate the original array", () => {
    const albums = [{ name: "A", year: 2010 }, { name: "B", year: 2020 }];
    const original = [...albums];
    sortAlbumsByYear(albums);
    expect(albums[0].name).toBe(original[0].name);
  });

  it("handles empty array", () => {
    expect(sortAlbumsByYear([])).toEqual([]);
  });
});
