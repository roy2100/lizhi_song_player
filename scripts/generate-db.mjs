#!/usr/bin/env node
/**
 * 从 list.js 生成规范化的 JSON 数据库文件
 * 输出：src/db.json
 *
 * 用法：node scripts/generate-db.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const ARTIST_NAME = "李志";
const FALLBACK_COVER =
  "https://cdn.jsdelivr.net/gh/nj-lizhi/song@main/audio/F/cover.png";

function normalizeUrl(url) {
  return String(url || "").replace(
    "https://testingcf.jsdelivr.net/",
    "https://cdn.jsdelivr.net/"
  );
}

function parseListJs(source) {
  try {
    return Function(`${source}; return list;`)();
  } catch (e) {
    console.error("解析 list.js 失败:", e.message);
    process.exit(1);
  }
}

function normalizeTracks(rawTracks) {
  return rawTracks.map((track, index) => {
    const albumName = String(track.artist || "未知专辑").replace(/^专辑-/, "");
    return {
      id: `${albumName}-${index}-${track.name}`,
      name: track.name,
      albumName,
      artist: ARTIST_NAME,
      url: normalizeUrl(track.url),
      cover: normalizeUrl(track.cover) || FALLBACK_COVER,
    };
  });
}

function buildAlbums(tracks) {
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

// 主流程
const listSource = readFileSync(resolve(ROOT, "data/list.js"), "utf-8");
const raw = parseListJs(listSource);
const tracks = normalizeTracks(raw);
const albums = buildAlbums(tracks);

const db = {
  generatedAt: new Date().toISOString(),
  stats: {
    tracks: tracks.length,
    albums: albums.length,
  },
  tracks,
  albums,
};

const outPath = resolve(ROOT, "src/db.json");
writeFileSync(outPath, JSON.stringify(db, null, 2), "utf-8");

console.log(`生成完成：${outPath}`);
console.log(`  歌曲：${tracks.length} 首`);
console.log(`  专辑：${albums.length} 张`);
