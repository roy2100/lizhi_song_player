import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  FastForward,
  ListMusic,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import listSource from "../list.js?raw";

const ARTIST_NAME = "李志";
const PLAYER_FALLBACK_COVER =
  "https://testingcf.jsdelivr.net/gh/nj-lizhi/song@main/audio/F/cover.png";

function getListData() {
  try {
    const parsedList = Function(`${listSource}; return list;`)();
    return Array.isArray(parsedList) ? parsedList : [];
  } catch {
    return [];
  }
}

function cleanAlbumName(artist) {
  return String(artist || "未知专辑").replace(/^专辑-/, "");
}

function normalizeAssetUrl(url) {
  return String(url || "").replace(
    "https://testingcf.jsdelivr.net/",
    "https://cdn.jsdelivr.net/"
  );
}

function normalizeTracks(rawTracks) {
  return rawTracks.map((track, index) => {
    const albumName = cleanAlbumName(track.artist);

    return {
      ...track,
      url: normalizeAssetUrl(track.url),
      cover: normalizeAssetUrl(track.cover),
      id: `${albumName}-${index}-${track.name}`,
      albumName,
      displayArtist: ARTIST_NAME,
    };
  });
}

function buildAlbums(tracks) {
  const albumMap = new Map();

  tracks.forEach((track) => {
    if (!albumMap.has(track.albumName)) {
      albumMap.set(track.albumName, {
        id: track.albumName,
        name: track.albumName,
        cover: track.cover,
        tracks: [],
      });
    }

    albumMap.get(track.albumName).tracks.push(track);
  });

  return Array.from(albumMap.values());
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "--:--";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function pickRandomTrack(tracks, avoidId) {
  if (!tracks.length) return null;
  if (tracks.length === 1) return tracks[0];

  const candidates = tracks.filter((track) => track.id !== avoidId);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function App() {
  const audioRef = useRef(null);
  const rawTracks = useMemo(() => getListData(), []);
  const tracks = useMemo(() => normalizeTracks(rawTracks), [rawTracks]);
  const albums = useMemo(() => buildAlbums(tracks), [tracks]);
  const featuredAlbum = useMemo(
    () =>
      albums.reduce((selected, album) => {
        if (!selected) return album;
        return album.tracks.length > selected.tracks.length ? album : selected;
      }, null),
    [albums]
  );
  const chartTracks = useMemo(() => tracks.slice(0, 12), [tracks]);

  const [activeAlbum, setActiveAlbum] = useState(null);
  const [queue, setQueue] = useState(tracks);
  const [currentTrack, setCurrentTrack] = useState(tracks[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState("all");
  const [volume, setVolume] = useState(0.88);
  const [trackDurations, setTrackDurations] = useState({});
  const [failedTracks, setFailedTracks] = useState({});

  useEffect(() => {
    setQueue(tracks);
    setCurrentTrack((track) => track || tracks[0] || null);
  }, [tracks]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    audio.load();
    setCurrentTime(0);
    setDuration(0);

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    if (!activeAlbum) return;

    let cancelled = false;
    const missingTracks = activeAlbum.tracks.filter(
      (track) => !trackDurations[track.id]
    );
    const metadataAudios = missingTracks.map((track) => {
      const metadataAudio = new Audio();

      metadataAudio.preload = "metadata";
      metadataAudio.src = track.url;
      metadataAudio.onloadedmetadata = () => {
        if (!cancelled) {
          setTrackDurations((durations) => ({
            ...durations,
            [track.id]: metadataAudio.duration || 0,
          }));
        }
      };
      metadataAudio.onerror = () => {};

      return metadataAudio;
    });

    return () => {
      cancelled = true;
      metadataAudios.forEach((metadataAudio) => {
        metadataAudio.removeAttribute("src");
        metadataAudio.load();
      });
    };
  }, [activeAlbum]);

  const currentQueue = queue.length ? queue : tracks;
  const currentIndex = currentTrack
    ? currentQueue.findIndex((track) => track.id === currentTrack.id)
    : -1;

  function playTrack(track, nextQueue = currentQueue) {
    setQueue(nextQueue.length ? nextQueue : tracks);
    setCurrentTrack(track);
    setIsPlaying(true);
  }

  function playAlbum(album) {
    if (!album?.tracks.length) return;
    playTrack(album.tracks[0], album.tracks);
  }

  function shuffleAlbum(album) {
    if (!album?.tracks.length) return;
    setIsShuffle(true);
    playTrack(pickRandomTrack(album.tracks), album.tracks);
  }

  function togglePlay() {
    if (!currentTrack && tracks[0]) {
      playTrack(tracks[0], tracks);
      return;
    }

    setIsPlaying((playing) => !playing);
  }

  function playNext() {
    if (!currentTrack) return;

    if (repeatMode === "one") {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
      return;
    }

    const nextTrack = isShuffle
      ? pickRandomTrack(currentQueue, currentTrack.id)
      : currentQueue[(currentIndex + 1) % currentQueue.length];

    if (nextTrack) playTrack(nextTrack, currentQueue);
  }

  function playPrevious() {
    if (!currentTrack) return;

    if (audioRef.current?.currentTime > 4) {
      audioRef.current.currentTime = 0;
      return;
    }

    const previousIndex =
      currentIndex <= 0 ? currentQueue.length - 1 : currentIndex - 1;
    const previousTrack = currentQueue[previousIndex];
    if (previousTrack) playTrack(previousTrack, currentQueue);
  }

  function handleEnded() {
    if (repeatMode === "one") {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => setIsPlaying(false));
      return;
    }

    const isLastTrack = currentIndex === currentQueue.length - 1;
    if (isLastTrack && repeatMode === "off" && !isShuffle) {
      setIsPlaying(false);
      return;
    }

    playNext();
  }

  function handleSeek(event) {
    const nextTime = Number(event.target.value);
    if (!audioRef.current || !Number.isFinite(nextTime)) return;

    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function handleLoadedMetadata() {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    setDuration(audio.duration || 0);
    setTrackDurations((durations) => ({
      ...durations,
      [currentTrack.id]: audio.duration || 0,
    }));
  }

  function handleAudioError() {
    if (!currentTrack) return;

    setFailedTracks((tracksById) => ({
      ...tracksById,
      [currentTrack.id]: true,
    }));

    setIsPlaying(false);
  }

  function cycleRepeatMode() {
    setRepeatMode((mode) => {
      if (mode === "all") return "one";
      if (mode === "one") return "off";
      return "all";
    });
  }

  if (!tracks.length) {
    return (
      <main className="empty-state">
        <h1>没有找到歌曲</h1>
        <p>请确认 list.js 已经加载，并且包含歌曲数组。</p>
      </main>
    );
  }

  return (
    <div className="app-shell">
      {activeAlbum ? (
        <AlbumDetail
          album={activeAlbum}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          trackDurations={trackDurations}
          failedTracks={failedTracks}
          onBack={() => setActiveAlbum(null)}
          onPlayAlbum={() => playAlbum(activeAlbum)}
          onShuffleAlbum={() => shuffleAlbum(activeAlbum)}
          onPlayTrack={(track) => playTrack(track, activeAlbum.tracks)}
        />
      ) : (
        <Home
          albums={albums}
          chartTracks={chartTracks}
          featuredAlbum={featuredAlbum}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onOpenAlbum={setActiveAlbum}
          onPlayTrack={(track) => playTrack(track, tracks)}
          onPlayAlbum={playAlbum}
        />
      )}

      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        volume={volume}
        onTogglePlay={togglePlay}
        onPrevious={playPrevious}
        onNext={playNext}
        onSeek={handleSeek}
        onToggleShuffle={() => setIsShuffle((value) => !value)}
        onCycleRepeat={cycleRepeatMode}
        onVolumeChange={setVolume}
      />

      <audio
        ref={audioRef}
        src={currentTrack?.url || ""}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
        onEnded={handleEnded}
        onError={handleAudioError}
      />
    </div>
  );
}

function Home({
  albums,
  chartTracks,
  featuredAlbum,
  currentTrack,
  isPlaying,
  onOpenAlbum,
  onPlayTrack,
  onPlayAlbum,
}) {
  const heroCover = featuredAlbum?.cover || PLAYER_FALLBACK_COVER;

  return (
    <main className="home-view">
      <section className="hero" style={{ "--hero-cover": `url("${heroCover}")` }}>
        <div className="hero-art-wrap">
          <img className="hero-art" src={heroCover} alt="" />
        </div>
        <button
          className="artist-title"
          type="button"
          onClick={() => featuredAlbum && onPlayAlbum(featuredAlbum)}
        >
          <span className="artist-play">
            <Play size={20} fill="currentColor" />
          </span>
          <span>{ARTIST_NAME}</span>
        </button>
      </section>

      <section className="content-section">
        <div className="section-title-row">
          <h2>歌曲排行</h2>
          <ListMusic size={18} />
        </div>
        <div className="chart-grid">
          {chartTracks.map((track, index) => (
            <button
              className={`chart-item ${
                currentTrack?.id === track.id ? "is-active" : ""
              }`}
              type="button"
              key={track.id}
              onClick={() => onPlayTrack(track)}
            >
              <img src={track.cover} alt="" />
              <span className="chart-meta">
                <strong>{track.name}</strong>
                <span>{track.albumName}</span>
              </span>
              <span className="chart-state">
                {currentTrack?.id === track.id && isPlaying ? (
                  <Pause size={14} fill="currentColor" />
                ) : (
                  index + 1
                )}
              </span>
            </button>
          ))}
        </div>
      </section>

      {featuredAlbum && (
        <section className="content-section">
          <h2>代表专辑</h2>
          <div className="featured-album">
            <button
              className="featured-main"
              type="button"
              onClick={() => onOpenAlbum(featuredAlbum)}
            >
              <img src={featuredAlbum.cover} alt="" />
              <span>
                <strong>{featuredAlbum.name}</strong>
                <small>{featuredAlbum.tracks.length} 首歌曲</small>
              </span>
            </button>
            <button
              className="featured-play"
              type="button"
              onClick={() => onPlayAlbum(featuredAlbum)}
              aria-label={`播放专辑 ${featuredAlbum.name}`}
            >
              <Play size={18} fill="currentColor" />
            </button>
          </div>
        </section>
      )}

      <section className="content-section">
        <h2>专辑</h2>
        <div className="album-rail">
          {albums.map((album) => (
            <button
              className="album-card"
              type="button"
              key={album.id}
              onClick={() => onOpenAlbum(album)}
            >
              <img src={album.cover} alt="" />
              <strong>{album.name}</strong>
              <span>{album.tracks.length} 首歌曲</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function AlbumDetail({
  album,
  currentTrack,
  isPlaying,
  trackDurations,
  failedTracks,
  onBack,
  onPlayAlbum,
  onShuffleAlbum,
  onPlayTrack,
}) {
  return (
    <main className="album-view">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={20} />
        <span>返回</span>
      </button>

      <section className="album-hero">
        <img className="album-cover" src={album.cover} alt="" />
        <div className="album-info">
          <p>专辑</p>
          <h1>{album.name}</h1>
          <h2>{ARTIST_NAME}</h2>
          <span>{album.tracks.length} 首歌曲</span>
          <div className="album-actions">
            <button type="button" onClick={onPlayAlbum}>
              <Play size={16} fill="currentColor" />
              播放
            </button>
            <button type="button" onClick={onShuffleAlbum}>
              <Shuffle size={16} />
              随机播放
            </button>
          </div>
        </div>
      </section>

      <section className="song-list">
        {album.tracks.map((track, index) => {
          const active = currentTrack?.id === track.id;
          const failed = failedTracks[track.id];

          return (
            <button
              className={`song-row ${active ? "is-active" : ""} ${
                failed ? "is-failed" : ""
              }`}
              type="button"
              key={track.id}
              onClick={() => onPlayTrack(track)}
            >
              <span className="song-index">
                {active && isPlaying ? (
                  <Pause size={15} fill="currentColor" />
                ) : active ? (
                  <Play size={15} fill="currentColor" />
                ) : (
                  index + 1
                )}
              </span>
              <span className="song-title">
                <strong>{track.name}</strong>
                {failed && <small>音频暂时不可播放</small>}
              </span>
              <span className="song-duration">
                {formatTime(trackDurations[track.id])}
              </span>
              <MoreHorizontal size={18} className="song-more" />
            </button>
          );
        })}
      </section>
    </main>
  );
}

function PlayerBar({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  isShuffle,
  repeatMode,
  volume,
  onTogglePlay,
  onPrevious,
  onNext,
  onSeek,
  onToggleShuffle,
  onCycleRepeat,
  onVolumeChange,
}) {
  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <aside className="player-bar">
      <div className="player-center">
        <div className="player-controls">
          <button
            className={isShuffle ? "is-enabled desktop-only" : "desktop-only"}
            type="button"
            onClick={onToggleShuffle}
            aria-label="随机播放"
          >
            <Shuffle size={18} />
          </button>
          <button className="desktop-only" type="button" onClick={onPrevious} aria-label="上一首">
            <SkipBack size={21} fill="currentColor" />
          </button>
          <button className="play-button" type="button" onClick={onTogglePlay} aria-label="播放暂停">
            {isPlaying ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}
          </button>
          <button type="button" onClick={onNext} aria-label="下一首">
            <SkipForward size={21} fill="currentColor" />
          </button>
          <button className="desktop-only small-skip" type="button" onClick={onNext} aria-label="快进">
            <FastForward size={18} fill="currentColor" />
          </button>
          <button
            className={repeatMode !== "off" ? "is-enabled desktop-only repeat-button" : "desktop-only repeat-button"}
            type="button"
            onClick={onCycleRepeat}
            aria-label="循环模式"
          >
            <Repeat size={18} />
            {repeatMode === "one" && <span>1</span>}
          </button>
        </div>
      </div>

      <div className="player-track">
        <img src={currentTrack?.cover || PLAYER_FALLBACK_COVER} alt="" />
        <div className="player-copy">
          <strong>{currentTrack?.name || "未选择歌曲"}</strong>
          <span>{currentTrack?.albumName || ARTIST_NAME}</span>
        </div>
        <div className="progress-wrap desktop-progress">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={Math.min(currentTime, duration || 0)}
            step="1"
            onChange={onSeek}
            style={{ "--progress": `${progress}%` }}
            aria-label="播放进度"
          />
        </div>
      </div>

      <div className="player-extra desktop-only">
        <MoreHorizontal size={18} />
        <MessageSquare size={17} />
        <Menu size={18} />
        <Volume2 size={18} />
        <input
          type="range"
          min="0"
          max="1"
          value={volume}
          step="0.01"
          onChange={(event) => onVolumeChange(Number(event.target.value))}
          style={{ "--progress": `${volume * 100}%` }}
          aria-label="音量"
        />
      </div>

      <div className="mobile-progress">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={Math.min(currentTime, duration || 0)}
          step="1"
          onChange={onSeek}
          style={{ "--progress": `${progress}%` }}
          aria-label="播放进度"
        />
      </div>
    </aside>
  );
}

export default App;
