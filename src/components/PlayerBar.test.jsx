import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlayerBar from "./PlayerBar";

const baseProps = {
  currentTrack: {
    id: "a/1",
    name: "测试歌曲",
    artist: "李志",
    albumName: "测试专辑",
    cover: "https://example.com/c.png",
  },
  isPlaying: false,
  currentTime: 0,
  duration: 200,
  isShuffle: false,
  repeatMode: "all",
  volume: 0.5,
  onTogglePlay: vi.fn(),
  onPrevious: vi.fn(),
  onNext: vi.fn(),
  onSeek: vi.fn(),
  onToggleShuffle: vi.fn(),
  onCycleRepeat: vi.fn(),
  onVolumeChange: vi.fn(),
};

function renderBar(overrides = {}) {
  const handlers = {
    onTogglePlay: vi.fn(),
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onSeek: vi.fn(),
    onToggleShuffle: vi.fn(),
    onCycleRepeat: vi.fn(),
    onVolumeChange: vi.fn(),
  };
  const props = { ...baseProps, ...handlers, ...overrides };
  render(<PlayerBar {...props} />);
  return props;
}

describe("PlayerBar", () => {
  it("shows current track name and artist", () => {
    renderBar();
    expect(screen.getByText("测试歌曲")).toBeInTheDocument();
    expect(screen.getByText("李志 — 测试专辑")).toBeInTheDocument();
  });

  it("shows placeholder when no track is selected", () => {
    renderBar({ currentTrack: null });
    expect(screen.getByText("未选择歌曲")).toBeInTheDocument();
    expect(screen.getByText("李志")).toBeInTheDocument();
  });

  it("clicking play/pause invokes onTogglePlay", async () => {
    const user = userEvent.setup();
    const props = renderBar();
    await user.click(screen.getByLabelText("播放暂停"));
    expect(props.onTogglePlay).toHaveBeenCalledTimes(1);
  });

  it("clicking next/previous invokes the handlers", async () => {
    const user = userEvent.setup();
    const props = renderBar();
    await user.click(screen.getByLabelText("下一首"));
    await user.click(screen.getByLabelText("上一首"));
    expect(props.onNext).toHaveBeenCalledTimes(1);
    expect(props.onPrevious).toHaveBeenCalledTimes(1);
  });

  it("clicking shuffle / repeat invokes the handlers", async () => {
    const user = userEvent.setup();
    const props = renderBar();
    await user.click(screen.getByLabelText("随机播放"));
    await user.click(screen.getByLabelText("循环模式"));
    expect(props.onToggleShuffle).toHaveBeenCalledTimes(1);
    expect(props.onCycleRepeat).toHaveBeenCalledTimes(1);
  });

  it("renders pause icon when isPlaying is true", () => {
    renderBar({ isPlaying: true });
    const btn = screen.getByLabelText("播放暂停");
    expect(btn.querySelector("svg")).toBeTruthy();
  });

  it("repeat-one shows the 1 badge", () => {
    renderBar({ repeatMode: "one" });
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
