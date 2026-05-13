# 李志音乐播放器

一个 Apple Music 风格的网页播放器，使用 React + Vite 构建，歌曲和专辑数据来自项目根目录的 `list.js`。

在线访问：

https://roy2100.github.io/lizhi_song_player/

## 学习目的与版权声明

本项目仅用于前端学习、React/Vite 实践和 UI 交互效果研究，不用于商业用途。

项目中展示的歌曲、封面、专辑名称等内容版权归原权利人所有。本项目不主张拥有相关音乐、图片或文字内容的版权。如相关权利人认为页面内容不应展示，请联系仓库维护者处理。

请勿将本项目用于未经授权的音乐传播、下载分发或商业运营。

## 功能

- 移动端优先的播放器界面
- 歌曲排行、代表专辑、专辑横向列表
- 专辑详情页与歌曲列表
- 悬浮毛玻璃播放控制条
- 播放、暂停、上一首、下一首、随机、循环、进度拖动、音量控制
- 自动从 `list.js` 按 `专辑-xxx` 分组生成专辑

## 技术栈

- React
- Vite
- lucide-react
- 原生 CSS

## 本地开发

```bash
npm ci
npm run dev
```

开发服务默认监听：

```text
http://localhost:5173/
```

局域网设备可通过当前机器 IP 访问，例如：

```text
http://192.168.31.20:5173/
```

## 构建

```bash
npm run build
```

构建产物会生成到 `dist/`。

## 本地预览

```bash
npm run preview
```

预览服务默认监听 `0.0.0.0:4173`。

## GitHub Pages 部署

项目已配置 GitHub Actions 自动部署。

推送到 `main` 分支后，会自动执行：

```bash
npm ci
GITHUB_PAGES=true npm run build
```

然后将 `dist/` 发布到 GitHub Pages。

部署工作流位于：

```text
.github/workflows/deploy-pages.yml
```

## 数据说明

`list.js` 是歌曲数据源，保持原始格式：

```js
var list = [
  {
    name: "歌曲名",
    artist: "专辑-专辑名",
    url: "音频地址",
    cover: "封面地址"
  }
];
```

应用会在运行时读取 `list.js`，并从 `artist` 字段中去掉 `专辑-` 前缀作为专辑名。
