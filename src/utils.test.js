import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatTime,
  loadPlayCounts,
  pickRandom,
  PLAY_COUNTS_KEY,
  savePlayCounts,
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
