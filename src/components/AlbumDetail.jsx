import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Pause, Play, Shuffle } from "lucide-react";
import { ARTIST_NAME, formatTime } from "../utils";

export default function AlbumDetail({
  albums,
  currentTrack,
  isPlaying,
  trackDurations,
  setTrackDurations,
  failedTracks,
  onBack,
  onPlayAlbum,
  onShuffleAlbum,
  playTrack,
}) {
  const { albumId } = useParams();
  const album = albums.find((a) => a.name === decodeURIComponent(albumId));

  useEffect(() => {
    if (!album) return;
    let cancelled = false;
    const missing = album.tracks.filter((t) => !trackDurations[t.id]);
    const audios = missing.map((track) => {
      const a = new Audio();
      a.preload = "metadata";
      a.src = track.url;
      a.onloadedmetadata = () => {
        if (!cancelled) {
          setTrackDurations((d) => ({ ...d, [track.id]: a.duration || 0 }));
        }
      };
      a.onerror = () => {};
      return a;
    });
    return () => {
      cancelled = true;
      audios.forEach((a) => {
        a.removeAttribute("src");
        a.load();
      });
    };
  }, [album?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!album) return <Navigate to="/" replace />;

  return (
    <main className="album-view" style={{ "--cover-bg": `url("${album.cover}")` }}>
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={20} />
        <span>返回</span>
      </button>

      <div className="album-hero">
        <img className="album-cover" src={album.cover} alt={album.name} />
        <div className="album-info">
          <p className="album-label">专辑</p>
          <h1 className="album-name">{album.name}</h1>
          <h2 className="album-artist">{ARTIST_NAME}</h2>
          <span className="album-meta">{album.tracks.length} 首歌曲</span>
          <div className="album-actions">
            <button
              className="btn-icon"
              type="button"
              onClick={() => onShuffleAlbum(album)}
              aria-label="随机播放"
            >
              <Shuffle size={17} />
            </button>
            <button className="btn-play" type="button" onClick={() => onPlayAlbum(album)}>
              <Play size={16} fill="currentColor" />
              播放
            </button>
          </div>
        </div>
      </div>

      <section className="song-list">
        {album.tracks.map((track, index) => {
          const active = currentTrack?.id === track.id;
          const failed = failedTracks[track.id];
          return (
            <button
              className={`song-row${active ? " is-active" : ""}${failed ? " is-failed" : ""}`}
              type="button"
              key={track.id}
              onClick={() => playTrack(track, album.tracks)}
            >
              <span className="song-index">
                {active && isPlaying ? (
                  <Pause size={14} fill="currentColor" />
                ) : active ? (
                  <Play size={14} fill="currentColor" />
                ) : (
                  index + 1
                )}
              </span>
              <span className="song-title">
                <strong>{track.name}</strong>
                {failed && <small>暂时不可播放</small>}
              </span>
              <span className="song-duration">
                {formatTime(trackDurations[track.id])}
              </span>
            </button>
          );
        })}
      </section>
    </main>
  );
}
