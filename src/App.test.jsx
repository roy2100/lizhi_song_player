import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { PLAY_COUNTS_KEY } from "./utils";

vi.mock("./db.json", () => ({
  default: {
    tracks: [],
    albums: [
      {
        id: "电声与管弦乐",
        name: "电声与管弦乐",
        year: 2017,
        cover: "https://example.com/a.png",
        tracks: [
          { name: "大象", url: "https://example.com/da-xiang.m4a", duration: 220 },
          { name: "和你在一起", url: "https://example.com/heni.m4a", duration: 200 },
          { name: "定西", url: "https://example.com/dx.m4a", duration: 240 },
        ],
      },
      {
        id: "1701",
        name: "1701",
        year: 2009,
        cover: "https://example.com/b.png",
        tracks: [
          { name: "热河", url: "https://example.com/rh.m4a", duration: 180 },
        ],
      },
    ],
  },
}));

function renderApp() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <App />
    </MemoryRouter>
  );
}

function readCounts() {
  return JSON.parse(localStorage.getItem(PLAY_COUNTS_KEY) || "{}");
}

function chartItems() {
  return screen
    .getAllByRole("button")
    .filter((b) => b.classList.contains("chart-item"));
}

function clickChartByTitle(user, title) {
  const item = chartItems().find((el) =>
    el.querySelector("strong")?.textContent === title
  );
  if (!item) throw new Error(`chart item not found: ${title}`);
  return user.click(item);
}

describe("App — play count behavior", () => {
  it("does not increment count on click alone", async () => {
    const user = userEvent.setup();
    renderApp();
    await clickChartByTitle(user, "大象");
    expect(readCounts()).toEqual({});
  });

  it("increments count once after audio fires playing event", async () => {
    const user = userEvent.setup();
    const { container } = renderApp();
    await clickChartByTitle(user, "大象");
    const audio = container.querySelector("audio");
    await act(async () => {
      fireEvent.playing(audio);
    });
    expect(readCounts()).toEqual({ "电声与管弦乐/大象": 1 });
  });

  it("does not double-count when playing fires twice for the same track (resume after pause)", async () => {
    const user = userEvent.setup();
    const { container } = renderApp();
    await clickChartByTitle(user, "大象");
    const audio = container.querySelector("audio");
    await act(async () => {
      fireEvent.playing(audio);
      fireEvent.playing(audio);
    });
    expect(readCounts()).toEqual({ "电声与管弦乐/大象": 1 });
  });

  it("increments separately for each track when switching", async () => {
    // 预置非零计数让两首歌都进入排行（一旦有任意播放，排行就只剩有计数的歌）
    localStorage.setItem(
      PLAY_COUNTS_KEY,
      JSON.stringify({
        "电声与管弦乐/大象": 1,
        "电声与管弦乐/和你在一起": 1,
      })
    );
    const user = userEvent.setup();
    const { container } = renderApp();
    const audio = container.querySelector("audio");

    await clickChartByTitle(user, "大象");
    await act(async () => {
      fireEvent.playing(audio);
    });

    await clickChartByTitle(user, "和你在一起");
    await act(async () => {
      fireEvent.playing(audio);
    });

    expect(readCounts()).toEqual({
      "电声与管弦乐/大象": 2,
      "电声与管弦乐/和你在一起": 2,
    });
  });

  it("does not count when audio errors before playing", async () => {
    const user = userEvent.setup();
    const { container } = renderApp();
    await clickChartByTitle(user, "大象");
    const audio = container.querySelector("audio");
    await act(async () => {
      fireEvent.error(audio);
    });
    expect(readCounts()).toEqual({});
  });
});

describe("App — repeat / shuffle behavior", () => {
  function getCurrentTrackTitle() {
    return document.querySelector(".player-copy strong")?.textContent;
  }

  it("repeat=all: ended on last track plays the first track", async () => {
    const user = userEvent.setup();
    const { container } = renderApp();
    const audio = container.querySelector("audio");

    // 进入 album 视图来准确控制队列：默认队列就是 tracks（全部），按点击切到 定西（队列第3首）
    await clickChartByTitle(user, "定西");
    await act(async () => {
      fireEvent.playing(audio);
    });
    expect(getCurrentTrackTitle()).toBe("定西");

    // ended 触发后应播下一首；队列是 [大象, 和你在一起, 定西, 热河]（按 db 顺序）
    await act(async () => {
      fireEvent.ended(audio);
    });
    expect(getCurrentTrackTitle()).toBe("热河");

    // 再 ended，热河是最后一首，repeat=all 默认会回到第一首
    await act(async () => {
      fireEvent.ended(audio);
    });
    expect(getCurrentTrackTitle()).toBe("大象");
  });

  it("repeat=one: ended replays the same track and counts again", async () => {
    const user = userEvent.setup();
    const { container } = renderApp();
    const audio = container.querySelector("audio");

    // 切到 repeat=one：默认 all → 点一次 → one
    await user.click(screen.getByLabelText("循环模式"));

    await clickChartByTitle(user, "大象");
    await act(async () => {
      fireEvent.playing(audio);
    });
    expect(readCounts()["电声与管弦乐/大象"]).toBe(1);

    // ended：因为是 repeat=one，currentTrack 不变，但 counted 标记应被重置
    await act(async () => {
      fireEvent.ended(audio);
      fireEvent.playing(audio);
    });
    expect(getCurrentTrackTitle()).toBe("大象");
    expect(readCounts()["电声与管弦乐/大象"]).toBe(2);
  });

  it("repeat=off: ended on last track pauses (no auto-next)", async () => {
    // 让 热河 进入排行
    localStorage.setItem(
      PLAY_COUNTS_KEY,
      JSON.stringify({ "1701/热河": 1 })
    );
    const user = userEvent.setup();
    const { container } = renderApp();
    const audio = container.querySelector("audio");

    // 默认 all → 点两次到 off
    const repeatBtn = screen.getByLabelText("循环模式");
    await user.click(repeatBtn);
    await user.click(repeatBtn);

    // 切到队列最后一首：热河
    await clickChartByTitle(user, "热河");
    await act(async () => {
      fireEvent.playing(audio);
    });

    await act(async () => {
      fireEvent.ended(audio);
    });
    // currentTrack 不该跳走（停留在 热河，因为 setIsPlaying(false) 但 track 不变）
    expect(getCurrentTrackTitle()).toBe("热河");
    // 计数：种子 1 + 这次 playing 1 = 2
    expect(readCounts()).toEqual({ "1701/热河": 2 });
  });

  it("shuffle: each ended switches to a different track than current", async () => {
    const user = userEvent.setup();
    const { container } = renderApp();
    const audio = container.querySelector("audio");

    await user.click(screen.getByLabelText("随机播放"));
    await clickChartByTitle(user, "大象");
    await act(async () => {
      fireEvent.playing(audio);
    });
    let prevTitle = getCurrentTrackTitle();
    expect(prevTitle).toBe("大象");

    const seen = new Set([prevTitle]);
    for (let i = 0; i < 8; i++) {
      await act(async () => {
        fireEvent.ended(audio);
      });
      const title = getCurrentTrackTitle();
      // 不变式：shuffle 模式下，下一首一定不等于当前刚结束的那首
      expect(title).not.toBe(prevTitle);
      seen.add(title);
      prevTitle = title;
      await act(async () => {
        fireEvent.playing(audio);
      });
    }
    // 8 次足够多，应该覆盖到至少 2 首不同的随机曲（队列总共 4 首）
    expect(seen.size).toBeGreaterThanOrEqual(2);
  });

  it("cycle repeat: all → one → off → all (badge appears only in 'one')", async () => {
    const user = userEvent.setup();
    renderApp();
    const repeatBtn = screen.getByLabelText("循环模式");

    // 初始 all：badge 不出现
    expect(screen.queryByText("1")).not.toBeInTheDocument();

    await user.click(repeatBtn);
    expect(screen.getByText("1")).toBeInTheDocument(); // one

    await user.click(repeatBtn);
    expect(screen.queryByText("1")).not.toBeInTheDocument(); // off

    await user.click(repeatBtn);
    expect(screen.queryByText("1")).not.toBeInTheDocument(); // all
  });
});

describe("App — chart sorting", () => {
  it("orders chart tracks by stored play counts", async () => {
    localStorage.setItem(
      PLAY_COUNTS_KEY,
      JSON.stringify({
        "电声与管弦乐/定西": 5,
        "电声与管弦乐/大象": 2,
        "1701/热河": 9,
      })
    );
    renderApp();
    const items = screen
      .getAllByRole("button")
      .filter((b) => b.classList.contains("chart-item"));
    const titles = items.map((el) => el.querySelector("strong")?.textContent);
    expect(titles.slice(0, 3)).toEqual(["热河", "定西", "大象"]);
  });

  it("falls back to featured album when no plays recorded", () => {
    renderApp();
    const items = screen
      .getAllByRole("button")
      .filter((b) => b.classList.contains("chart-item"));
    const titles = items.map((el) => el.querySelector("strong")?.textContent);
    // 代表专辑是 电声与管弦乐，顺序就是 db 中的顺序
    expect(titles).toEqual(["大象", "和你在一起", "定西"]);
  });
});
