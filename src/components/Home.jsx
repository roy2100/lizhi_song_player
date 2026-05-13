import { ChevronRight, MoreHorizontal, Pause, Play } from "lucide-react";
import { ARTIST_NAME } from "../utils";

export default function Home({
  albums,
  chartTracks,
  featuredAlbum,
  artistCover,
  currentTrack,
  isPlaying,
  onOpenAlbum,
  onPlayTrack,
  onPlayAlbum,
}) {
  return (
    <>
      <section className="hero" style={{ "--hero-cover": `url("${artistCover}")` }}>
        <div className="hero-inner">
          <div className="hero-art-wrap">
            <img className="hero-art" src={artistCover} alt={ARTIST_NAME} />
          </div>
          <div className="hero-footer">
            <button
              className="hero-play"
              type="button"
              onClick={() => featuredAlbum && onPlayAlbum(featuredAlbum)}
              aria-label="播放"
            >
              <Play size={20} fill="currentColor" />
            </button>
            <span className="hero-name">{ARTIST_NAME}</span>
          </div>
        </div>
      </section>

      <main className="home-view">
      <section className="content-section">
        <div className="section-header">
          <h2>歌曲排行</h2>
          <ChevronRight size={18} />
        </div>
        <div className="chart-grid">
          {chartTracks.map((track) => (
            <button
              className={`chart-item${currentTrack?.id === track.id ? " is-active" : ""}`}
              type="button"
              key={track.id}
              onClick={() => onPlayTrack(track)}
            >
              <img src={track.cover} alt="" />
              <span className="chart-meta">
                <strong>{track.name}</strong>
                <span>{track.albumName}</span>
              </span>
              <MoreHorizontal size={16} className="chart-more" />
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
              aria-label={`播放 ${featuredAlbum.name}`}
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
    </>
  );
}
