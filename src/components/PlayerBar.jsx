import {
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { ARTIST_NAME, FALLBACK_COVER } from "../utils";

export default function PlayerBar({
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
            className={`desktop-only${isShuffle ? " is-active" : ""}`}
            type="button"
            onClick={onToggleShuffle}
            aria-label="随机播放"
          >
            <Shuffle size={18} />
          </button>
          <button
            className="desktop-only"
            type="button"
            onClick={onPrevious}
            aria-label="上一首"
          >
            <SkipBack size={21} fill="currentColor" />
          </button>
          <button
            className="play-btn"
            type="button"
            onClick={onTogglePlay}
            aria-label="播放暂停"
          >
            {isPlaying ? (
              <Pause size={21} fill="currentColor" />
            ) : (
              <Play size={21} fill="currentColor" />
            )}
          </button>
          <button type="button" onClick={onNext} aria-label="下一首">
            <SkipForward size={21} fill="currentColor" />
          </button>
          <button
            className={`desktop-only repeat-btn${repeatMode !== "off" ? " is-active" : ""}`}
            type="button"
            onClick={onCycleRepeat}
            aria-label="循环模式"
          >
            <Repeat size={18} />
            {repeatMode === "one" && <span className="repeat-badge">1</span>}
          </button>
        </div>
      </div>

      <div className="player-track">
        <img src={currentTrack?.cover || FALLBACK_COVER} alt="" />
        <div className="player-copy">
          <strong>{currentTrack?.name || "未选择歌曲"}</strong>
          <span>
            {currentTrack
              ? `${currentTrack.displayArtist} — ${currentTrack.albumName}`
              : ARTIST_NAME}
          </span>
        </div>
        <div className="desktop-progress">
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
        <Volume2 size={18} />
        <input
          type="range"
          min="0"
          max="1"
          value={volume}
          step="0.01"
          onChange={(e) => onVolumeChange(Number(e.target.value))}
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
