import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import db from "./db.json";
import {
  FALLBACK_COVER,
  computeChartTracks,
  loadPlayCounts,
  normalizeAlbums,
  pickRandom,
  savePlayCounts,
  selectNextTrack,
} from "./utils";
import AlbumDetail from "./components/AlbumDetail";
import Home from "./components/Home";
import PlayerBar from "./components/PlayerBar";
import QueuePanel from "./components/QueuePanel";

function setMediaSessionAction(action, handler) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.setActionHandler(action, handler);
  } catch {}
}

function updateMediaSessionPosition(audio) {
  if (
    typeof navigator === "undefined" ||
    !("mediaSession" in navigator) ||
    typeof navigator.mediaSession.setPositionState !== "function" ||
    !audio ||
    !Number.isFinite(audio.duration) ||
    audio.duration <= 0
  ) return;
  try {
    navigator.mediaSession.setPositionState({
      duration: audio.duration,
      playbackRate: audio.playbackRate || 1,
      position: Math.min(audio.currentTime || 0, audio.duration),
    });
  } catch {}
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const audioRef = useRef(null);
  const albums = useMemo(() => normalizeAlbums(db.albums), []);
  const tracks = useMemo(() => albums.flatMap((a) => a.tracks), [albums]);

  const featuredAlbum = useMemo(
    () =>
      albums.find((a) => a.name === "电声与管弦乐") ||
      albums.reduce((best, a) => {
        if (!best) return a;
        return a.tracks.length > best.tracks.length ? a : best;
      }, null),
    [albums]
  );

  const artistCover =
    albums.find((a) => a.name === "你好，郑州")?.cover || FALLBACK_COVER;

  const [queue, setQueue] = useState(tracks);
  const [currentTrack, setCurrentTrack] = useState(tracks[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState("all");
  const [volume, setVolume] = useState(0.88);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [failedTracks, setFailedTracks] = useState({});
  // 排行用快照渲染：只在进入首页时刷新；播放写入走 ref + localStorage，
  // 避免每次播放都触发 chart 重排带来跳动。
  const [chartCounts, setChartCounts] = useState(() => loadPlayCounts());
  const playCountsRef = useRef(null);
  if (playCountsRef.current === null) {
    playCountsRef.current = loadPlayCounts();
  }

  const chartTracks = useMemo(
    () => computeChartTracks(tracks, chartCounts, featuredAlbum),
    [featuredAlbum, tracks, chartCounts]
  );

  useEffect(() => {
    if (location.pathname === "/") {
      const fresh = loadPlayCounts();
      playCountsRef.current = fresh;
      setChartCounts(fresh);
    }
  }, [location.pathname]);

  useEffect(() => {
    setQueue(tracks);
    setCurrentTrack((t) => t || tracks[0] || null);
  }, [tracks]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.load();
    setCurrentTime(0);
    setDuration(0);
    if (isPlaying) audio.play().catch(() => setIsPlaying(false));
  }, [currentTrack]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  const currentQueue = queue.length ? queue : tracks;
  const currentIndex = currentTrack
    ? currentQueue.findIndex((t) => t.id === currentTrack.id)
    : -1;

  function playTrack(track, nextQueue = currentQueue) {
    setQueue(nextQueue.length ? nextQueue : tracks);
    setCurrentTrack(track);
    setIsPlaying(true);
  }

  const countedRef = useRef(false);

  useEffect(() => {
    countedRef.current = false;
  }, [currentTrack?.id]);

  function handlePlaying() {
    if (!currentTrack || countedRef.current) return;
    countedRef.current = true;
    const next = {
      ...playCountsRef.current,
      [currentTrack.id]: (playCountsRef.current[currentTrack.id] ?? 0) + 1,
    };
    playCountsRef.current = next;
    savePlayCounts(next);
  }

  function playAlbum(album) {
    if (!album?.tracks.length) return;
    playTrack(album.tracks[0], album.tracks);
  }

  function shuffleAlbum(album) {
    if (!album?.tracks.length) return;
    setIsShuffle(true);
    playTrack(pickRandom(album.tracks), album.tracks);
  }

  function togglePlay() {
    if (!currentTrack && tracks[0]) {
      playTrack(tracks[0], tracks);
      return;
    }
    setIsPlaying((p) => !p);
  }

  function playNext() {
    if (!currentTrack) return;
    if (repeatMode === "one") {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
      return;
    }
    const next = isShuffle
      ? pickRandom(currentQueue, currentTrack.id)
      : currentQueue[(currentIndex + 1) % currentQueue.length];
    if (next) playTrack(next, currentQueue);
  }

  function playPrevious() {
    if (!currentTrack) return;
    if (audioRef.current?.currentTime > 4) {
      audioRef.current.currentTime = 0;
      return;
    }
    const prevIndex =
      currentIndex <= 0 ? currentQueue.length - 1 : currentIndex - 1;
    const prev = currentQueue[prevIndex];
    if (prev) playTrack(prev, currentQueue);
  }

  function handleEnded() {
    if (repeatMode === "one") {
      countedRef.current = false;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => setIsPlaying(false));
      return;
    }
    const next = selectNextTrack({
      queue: currentQueue,
      currentTrackId: currentTrack.id,
      isShuffle,
      repeatMode,
    });
    if (!next) {
      setIsPlaying(false);
      return;
    }
    playTrack(next, currentQueue);
  }

  function handleSeek(e) {
    const t = Number(e.target.value);
    if (!audioRef.current || !Number.isFinite(t)) return;
    audioRef.current.currentTime = t;
    setCurrentTime(t);
  }

  function handleLoadedMetadata() {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    setDuration(audio.duration || 0);
  }

  function handleAudioError() {
    if (!currentTrack) return;
    setFailedTracks((d) => ({ ...d, [currentTrack.id]: true }));
    setIsPlaying(false);
  }

  function cycleRepeatMode() {
    setRepeatMode((m) => (m === "all" ? "one" : m === "one" ? "off" : "all"));
  }

  useEffect(() => {
    if (
      typeof navigator === "undefined" ||
      !("mediaSession" in navigator) ||
      typeof MediaMetadata !== "function" ||
      !currentTrack
    ) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.name,
      artist: currentTrack.artist,
      album: currentTrack.albumName,
      artwork: [{ src: currentTrack.cover, sizes: "512x512", type: "image/png" }],
    });
  }, [currentTrack]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    setMediaSessionAction("play", () => {
      if (!currentTrack && tracks[0]) {
        playTrack(tracks[0], tracks);
        return;
      }
      setIsPlaying(true);
    });
    setMediaSessionAction("pause", () => setIsPlaying(false));
    setMediaSessionAction("stop", () => {
      if (audio) audio.currentTime = 0;
      setIsPlaying(false);
    });
    setMediaSessionAction("previoustrack", playPrevious);
    setMediaSessionAction("nexttrack", playNext);
    setMediaSessionAction("seekbackward", (details) => {
      if (!audio) return;
      const offset = details.seekOffset || 10;
      audio.currentTime = Math.max((audio.currentTime || 0) - offset, 0);
      setCurrentTime(audio.currentTime);
      updateMediaSessionPosition(audio);
    });
    setMediaSessionAction("seekforward", (details) => {
      if (!audio || !Number.isFinite(audio.duration)) return;
      const offset = details.seekOffset || 10;
      audio.currentTime = Math.min((audio.currentTime || 0) + offset, audio.duration);
      setCurrentTime(audio.currentTime);
      updateMediaSessionPosition(audio);
    });
    setMediaSessionAction("seekto", (details) => {
      if (!audio || !Number.isFinite(details.seekTime)) return;
      audio.currentTime = details.seekTime;
      setCurrentTime(details.seekTime);
      updateMediaSessionPosition(audio);
    });
    return () => {
      [
        "play", "pause", "stop",
        "previoustrack", "nexttrack",
        "seekbackward", "seekforward", "seekto",
      ].forEach((a) => setMediaSessionAction(a, null));
    };
  }, [currentTrack, currentQueue, currentIndex, isShuffle, repeatMode, tracks]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    updateMediaSessionPosition(audioRef.current);
  }, [currentTime, duration]);

  if (!tracks.length) {
    return (
      <main className="empty-state">
        <h1>没有找到歌曲</h1>
        <p>请确认 src/db.json 已正确生成。</p>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route
          path="/"
          element={
            <Home
              albums={albums}
              chartTracks={chartTracks}
              featuredAlbum={featuredAlbum}
              artistCover={artistCover}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onOpenAlbum={(album) =>
                navigate(`/album/${encodeURIComponent(album.name)}`)
              }
              onPlayTrack={(track) => playTrack(track, chartTracks)}
              onPlayAlbum={playAlbum}
            />
          }
        />
        <Route
          path="/album/:albumId"
          element={
            <AlbumDetail
              albums={albums}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              failedTracks={failedTracks}
              onBack={() => navigate("/")}
              onPlayAlbum={playAlbum}
              onShuffleAlbum={shuffleAlbum}
              playTrack={playTrack}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <QueuePanel
        queue={currentQueue}
        currentTrack={currentTrack}
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        onPlayTrack={(track) => playTrack(track, currentQueue)}
      />

      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        volume={volume}
        isQueueOpen={isQueueOpen}
        onTogglePlay={togglePlay}
        onPrevious={playPrevious}
        onNext={playNext}
        onSeek={handleSeek}
        onToggleShuffle={() => setIsShuffle((v) => !v)}
        onCycleRepeat={cycleRepeatMode}
        onVolumeChange={setVolume}
        onToggleQueue={() => setIsQueueOpen((v) => !v)}
      />

      <audio
        ref={audioRef}
        src={currentTrack?.url || ""}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onPlaying={handlePlaying}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
        onEnded={handleEnded}
        onError={handleAudioError}
      />
    </div>
  );
}
