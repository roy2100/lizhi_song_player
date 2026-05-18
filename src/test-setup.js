import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// jsdom 没实现真实音频播放，给 play/pause/load 一个最小可用桩
if (typeof window !== "undefined" && window.HTMLMediaElement) {
  window.HTMLMediaElement.prototype.play = function play() {
    return Promise.resolve();
  };
  window.HTMLMediaElement.prototype.pause = function pause() {};
  window.HTMLMediaElement.prototype.load = function load() {};
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});
