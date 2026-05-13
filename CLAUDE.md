# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 语言

请始终使用中文回复。

## 项目概览

李志音乐播放器 —— Apple Music 风格的移动端优先网页播放器，按照完整 Web App 标准开发。React + Vite 构建，`react-router-dom` HashRouter 路由，无额外状态管理库。

在线地址：https://roy2100.github.io/lizhi_song_player/

## 开发标准

本项目按照**完整 Web App** 规范开发，具体意味着：

- **路由优先**：每个独立页面/视图都应有对应 URL，使用 HashRouter，路由在 `src/App.jsx` 中的 `<Routes>` 统一声明
- **组件拆分**：每个视图对应一个独立组件文件，放在 `src/components/`，组件只做渲染（无副作用状态）
- **状态集中**：全局播放状态（队列、当前曲目、进度、音量等）统一由 `App` 持有，通过 props 下传，不在组件内部创建重复状态
- **功能完整**：新增的控件、按钮必须有实际功能，不允许"占位"按钮出现在生产版本中
- **移动端优先**：样式以移动端为基准，通过 `@media (min-width: 720px)` / `@media (min-width: 1040px)` 渐进增强到桌面端
- **UI 对标 Apple Music**：布局、间距、动效参照 Apple Music，毛玻璃播放栏、渐变专辑背景等视觉效果保持一致

## 常用命令

```bash
npm ci            # 安装依赖（推荐，锁定版本）
npm run dev       # 本地开发（0.0.0.0:5173，局域网可访问）
npm run build     # 生产构建，输出到 dist/
npm run preview   # 本地预览构建产物（0.0.0.0:4173）
```

提交前必须运行 `npm run build` 确认无构建错误。

## 文件结构

```
src/
  main.jsx              # 入口，挂载 HashRouter + App
  App.jsx               # 全局状态 + 路由表 + 音频元素 + MediaSession
  utils.js              # 纯函数：数据加载、规范化、格式化、随机选曲
  styles.css            # 全部样式，mobile-first
  components/
    Home.jsx            # 首页（/ ）：Hero、歌曲排行、代表专辑、专辑列表
    AlbumDetail.jsx     # 专辑详情（/album/:albumId）：曲目列表 + 时长懒加载
    PlayerBar.jsx       # 底部固定播放控制条
```

新增页面/视图时，在 `src/components/` 创建新文件，并在 `App.jsx` 的 `<Routes>` 里注册路由。

## 路由

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | `Home` | 首页 |
| `/album/:albumId` | `AlbumDetail` | 专辑详情，`albumId` 为 `encodeURIComponent(album.id)` |
| `*` | `<Navigate to="/" />` | 未知路径重定向首页 |

`album.id` 等于 `albumName`（中文专辑名）。

## 数据流

1. `list.js` 通过 `?raw` import 以字符串载入，`getListData()` 用 `Function()` 解析为数组（保持原始格式，不要改写 `list.js`）
2. `normalizeTracks`：解析 `artist` 字段中的专辑名（去掉 `专辑-` 前缀），规范化 CDN 域名（`testingcf.jsdelivr.net` → `cdn.jsdelivr.net`），生成唯一 `id`
3. `buildAlbums`：按 `albumName` 分组生成专辑列表

`list.js` 每条数据格式：
```js
{ name: "歌曲名", artist: "专辑-专辑名", url: "音频地址", cover: "封面地址" }
```

## 约定

- 不引入完整 UI 库，只使用 `lucide-react` 图标库
- 样式集中在 `src/styles.css`，不使用 CSS Modules 或 Tailwind
- GitHub Pages 部署：推送 `main` 分支后 `.github/workflows/deploy-pages.yml` 自动触发；构建时注入 `GITHUB_PAGES=true`，Vite 使用 `/lizhi_song_player/` 作为 `base`
- `list.js` 保持原始格式，不重构或转换其数据结构
