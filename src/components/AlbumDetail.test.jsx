import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AlbumDetail from "./AlbumDetail";

const albums = [
  {
    id: "电声与管弦乐",
    name: "电声与管弦乐",
    cover: "",
    tracks: [
      { id: "电声与管弦乐/大象", name: "大象", duration: 100, albumName: "电声与管弦乐", cover: "", artist: "李志" },
      { id: "电声与管弦乐/定西", name: "定西", duration: 200, albumName: "电声与管弦乐", cover: "", artist: "李志" },
    ],
  },
];

function renderDetail(overrides = {}) {
  const handlers = {
    onBack: vi.fn(),
    onPlayAlbum: vi.fn(),
    onShuffleAlbum: vi.fn(),
    playTrack: vi.fn(),
  };
  const props = {
    albums,
    currentTrack: null,
    isPlaying: false,
    failedTracks: {},
    ...handlers,
    ...overrides,
  };
  render(
    <MemoryRouter initialEntries={["/album/" + encodeURIComponent("电声与管弦乐")]}>
      <Routes>
        <Route path="/album/:albumId" element={<AlbumDetail {...props} />} />
      </Routes>
    </MemoryRouter>
  );
  return props;
}

describe("AlbumDetail", () => {
  it("renders album name and track list", () => {
    renderDetail();
    expect(screen.getByText("电声与管弦乐")).toBeInTheDocument();
    expect(screen.getByText("大象")).toBeInTheDocument();
    expect(screen.getByText("定西")).toBeInTheDocument();
    expect(screen.getByText("2 首歌曲")).toBeInTheDocument();
  });

  it("clicking a song row calls playTrack with track and album tracks", async () => {
    const user = userEvent.setup();
    const props = renderDetail();
    await user.click(screen.getByText("定西"));
    expect(props.playTrack).toHaveBeenCalledWith(
      albums[0].tracks[1],
      albums[0].tracks
    );
  });

  it("clicking 播放 invokes onPlayAlbum", async () => {
    const user = userEvent.setup();
    const props = renderDetail();
    await user.click(screen.getByRole("button", { name: "播放" }));
    expect(props.onPlayAlbum).toHaveBeenCalledWith(albums[0]);
  });

  it("clicking shuffle invokes onShuffleAlbum", async () => {
    const user = userEvent.setup();
    const props = renderDetail();
    await user.click(screen.getByLabelText("随机播放"));
    expect(props.onShuffleAlbum).toHaveBeenCalledWith(albums[0]);
  });

  it("clicking back invokes onBack", async () => {
    const user = userEvent.setup();
    const props = renderDetail();
    await user.click(screen.getByText("返回"));
    expect(props.onBack).toHaveBeenCalled();
  });

  it("marks failed tracks", () => {
    renderDetail({ failedTracks: { "电声与管弦乐/大象": true } });
    expect(screen.getByText("暂时不可播放")).toBeInTheDocument();
  });

  it("redirects when album does not exist", () => {
    render(
      <MemoryRouter initialEntries={["/album/not-exist"]}>
        <Routes>
          <Route
            path="/album/:albumId"
            element={
              <AlbumDetail
                albums={albums}
                currentTrack={null}
                isPlaying={false}
                failedTracks={{}}
                onBack={vi.fn()}
                onPlayAlbum={vi.fn()}
                onShuffleAlbum={vi.fn()}
                playTrack={vi.fn()}
              />
            }
          />
          <Route path="/" element={<div>HOME</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("HOME")).toBeInTheDocument();
  });
});
