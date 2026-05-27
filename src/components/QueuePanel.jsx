import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export default function QueuePanel({ queue, currentTrack, isOpen, onClose, onPlayTrack }) {
  const activeRef = useRef(null);

  // 打开时自动滚动到当前曲目
  useEffect(() => {
    if (isOpen && activeRef.current) {
      activeRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [isOpen]);

  return (
    <>
      {/* 半透明遮罩，点击关闭 */}
      <div
        className={`queue-backdrop${isOpen ? " is-open" : ""}`}
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        className={`queue-panel${isOpen ? " is-open" : ""}`}
        aria-label="播放队列"
        aria-hidden={!isOpen}
      >
        <div className="queue-header">
          <h3>播放队列</h3>
          <span className="queue-count">{queue.length} 首</span>
          <button type="button" className="queue-close" onClick={onClose} aria-label="关闭队列">
            <X size={16} />
          </button>
        </div>

        <div className="queue-list">
          {queue.map((track, index) => {
            const isActive = currentTrack?.id === track.id;
            return (
              <button
                key={track.id}
                ref={isActive ? activeRef : null}
                className={`queue-item${isActive ? " is-active" : ""}`}
                type="button"
                onClick={() => {
                  onPlayTrack(track);
                  onClose();
                }}
              >
                <span className="queue-index">{index + 1}</span>
                <img
                  src={track.cover}
                  alt=""
                  width="36"
                  height="36"
                  loading="lazy"
                  decoding="async"
                />
                <span className="queue-meta">
                  <strong>{track.name}</strong>
                  <span>{track.albumName}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
