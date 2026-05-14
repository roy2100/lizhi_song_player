import { Play } from "lucide-react";

export default function AlbumCard({ album, onOpen, onPlay }) {
  return (
    <div className="album-card-wrap">
      <button className="album-card" type="button" onClick={onOpen}>
        <img src={album.cover} alt="" />
        <strong>{album.name}</strong>
        <span>{album.year ? `${album.year}年` : ""}</span>
      </button>
      {onPlay && (
        <button
          className="album-card-play"
          type="button"
          onClick={onPlay}
          aria-label={`播放 ${album.name}`}
        >
          <Play size={16} fill="currentColor" />
        </button>
      )}
    </div>
  );
}
