import { Play } from "lucide-react";
import { ARTIST_NAME, sortAlbumsByYear } from "../utils";
import AlbumCard from "./AlbumCard";

export default function Home({
  albums,
  chartTracks,
  featuredAlbum,
  june4Album,
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
            <img
              className="hero-art"
              src={artistCover}
              alt={ARTIST_NAME}
              width="500"
              height="500"
              fetchPriority="high"
            />
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
        </div>
        <div className="chart-grid">
          {chartTracks.map((track) => (
            <button
              className={`chart-item${currentTrack?.id === track.id ? " is-active" : ""}`}
              type="button"
              key={track.id}
              onClick={() => onPlayTrack(track)}
            >
              <img
                src={track.cover}
                alt=""
                width="44"
                height="44"
                loading="lazy"
                decoding="async"
              />
              <span className="chart-meta">
                <strong>{track.name}</strong>
                <span>{track.albumName}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {featuredAlbum && (
        <section className="content-section">
          <h2>代表专辑</h2>
          <div className="album-rail">
            <AlbumCard
              album={featuredAlbum}
              onOpen={() => onOpenAlbum(featuredAlbum)}
            />
            {june4Album && (
              <AlbumCard
                album={june4Album}
                onOpen={() => onOpenAlbum(june4Album)}
              />
            )}
          </div>
        </section>
      )}

      <section className="content-section">
        <h2>专辑</h2>
        <div className="album-rail">
          {sortAlbumsByYear(albums).map((album) => (
              <AlbumCard
                key={album.name}
                album={album}
                onOpen={() => onOpenAlbum(album)}
              />
            ))}
        </div>
      </section>
    </main>
    </>
  );
}
