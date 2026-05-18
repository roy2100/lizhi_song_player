import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./Home";

const tracks = [
  { id: "a/1", name: "歌1", albumName: "a", cover: "" },
  { id: "a/2", name: "歌2", albumName: "a", cover: "" },
];
const featuredAlbum = { id: "a", name: "a", tracks, cover: "" };
const albums = [featuredAlbum];

function renderHome(overrides = {}) {
  const handlers = {
    onOpenAlbum: vi.fn(),
    onPlayTrack: vi.fn(),
    onPlayAlbum: vi.fn(),
  };
  const props = {
    albums,
    chartTracks: tracks,
    featuredAlbum,
    artistCover: "https://example.com/artist.png",
    currentTrack: null,
    isPlaying: false,
    ...handlers,
    ...overrides,
  };
  render(<Home {...props} />);
  return props;
}

describe("Home", () => {
  it("renders chart tracks", () => {
    renderHome();
    expect(screen.getByText("歌1")).toBeInTheDocument();
    expect(screen.getByText("歌2")).toBeInTheDocument();
  });

  it("clicking a chart row invokes onPlayTrack with that track", async () => {
    const user = userEvent.setup();
    const props = renderHome();
    await user.click(screen.getByText("歌2"));
    expect(props.onPlayTrack).toHaveBeenCalledWith(tracks[1]);
  });

  it("clicking the hero play button plays the featured album", async () => {
    const user = userEvent.setup();
    const props = renderHome();
    await user.click(screen.getByLabelText("播放"));
    expect(props.onPlayAlbum).toHaveBeenCalledWith(featuredAlbum);
  });

  it("renders the chart in the order received (already sorted by parent)", () => {
    const ordered = [
      { id: "b/2", name: "B2", albumName: "b", cover: "" },
      { id: "a/1", name: "A1", albumName: "a", cover: "" },
      { id: "c/3", name: "C3", albumName: "c", cover: "" },
    ];
    renderHome({ chartTracks: ordered });
    const items = screen.getAllByRole("button").filter((b) =>
      b.classList.contains("chart-item")
    );
    expect(items.map((el) => el.textContent)).toEqual([
      "B2b",
      "A1a",
      "C3c",
    ]);
  });

  it("marks the active track when currentTrack matches", () => {
    renderHome({ currentTrack: tracks[0] });
    const items = screen
      .getAllByRole("button")
      .filter((b) => b.classList.contains("chart-item"));
    expect(items[0].className).toContain("is-active");
    expect(items[1].className).not.toContain("is-active");
  });
});
