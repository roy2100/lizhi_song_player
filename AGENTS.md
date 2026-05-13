# AGENTS.md

## 语言

请始终使用中文回复。

## 项目概览

这是一个 React + Vite 的移动端优先网页音乐播放器，数据来自根目录 `list.js`。

- `list.js` 保持原始数据格式，不要随意改写。
- 应用通过 `src/App.jsx` 使用 `../list.js?raw` 读取歌曲数据。
- 歌曲的 `artist` 字段格式为 `专辑-xxx`，用于解析专辑名和分组。
- 音频与封面 URL 会在运行时从 `testingcf.jsdelivr.net` 规范化为 `cdn.jsdelivr.net`。

## 开发命令

- 安装依赖：`npm ci`
- 本地开发：`npm run dev`
- 生产构建：`npm run build`
- 本地预览：`npm run preview`

开发服务默认监听 `0.0.0.0:5173`，可在局域网访问。

## 部署

项目使用 GitHub Actions 部署到 GitHub Pages。

- 工作流文件：`.github/workflows/deploy-pages.yml`
- Pages 地址：`https://roy2100.github.io/lizhi_song_player/`
- Pages 构建时通过 `GITHUB_PAGES=true` 让 Vite 使用 `/lizhi_song_player/` 作为 `base`。

## 维护约定

- 不引入完整 UI 库；当前只使用 `lucide-react` 作为图标库。
- 样式集中在 `src/styles.css`，优先保持 Apple Music 风格、毛玻璃悬浮播放器和 mobile first 布局。
- 提交前至少运行 `npm run build`。
- 不提交 `node_modules/`、`dist/` 或本地截图检查文件。
- 若新增播放器按钮，请确保它有实际功能，避免部署版本出现冗余控件。
- 项目说明应明确仅用于学习和技术实践，不应描述为商业音乐服务或内容分发平台。
