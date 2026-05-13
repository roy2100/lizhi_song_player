# 李志音乐播放器

Apple Music 风格的移动端优先网页播放器，使用 React + Vite 构建。

在线访问：https://roy2100.github.io/lizhi_song_player/

## 学习目的与版权声明

本项目仅用于前端学习、React/Vite 实践和 UI 交互效果研究，不用于商业用途。

项目中展示的歌曲、封面、专辑名称等内容版权归原权利人所有。本项目不主张拥有相关音乐、图片或文字内容的版权。如相关权利人认为页面内容不应展示，请联系仓库维护者处理。

请勿将本项目用于未经授权的音乐传播、下载分发或商业运营。

## 功能

- 移动端优先布局，渐进增强到桌面宽屏
- 首页：Hero 艺人卡片、播放排行榜、代表专辑、专辑横向滚动列表
- 专辑详情页：曲目列表 + 时长懒加载
- 毛玻璃悬浮播放控制条
- 播放 / 暂停、上一首 / 下一首、随机播放、顺序 / 单曲 / 关闭循环
- 进度拖拽、音量控制（桌面）
- 播放次数统计（存 `localStorage`），首页排行榜按播放次数排序
- MediaSession API：锁屏 / 通知栏媒体控件、快进快退、封面显示
- PWA：可安装到主屏幕，离线缓存静态资源
- HashRouter 路由：每个页面有独立 URL，支持前进 / 后退

## 技术栈

- React 19 + Vite
- react-router-dom（HashRouter）
- lucide-react（图标）
- 原生 CSS，mobile-first

## 本地开发

```bash
npm ci          # 安装依赖（锁定版本）
npm run dev     # 启动开发服务器（0.0.0.0:5173，局域网可访问）
npm run build   # 生产构建，输出到 dist/
npm run preview # 本地预览构建产物（0.0.0.0:4173）
```

提交前务必运行 `npm run build` 确认无构建错误。

## 项目结构

```
src/
  main.jsx              # 入口，挂载 HashRouter + App
  App.jsx               # 全局状态 + 路由表 + 音频元素 + MediaSession
  db.json               # 构建时由 list.js 生成的静态歌曲数据
  utils.js              # 纯函数：数据加载、格式化、随机选曲
  styles.css            # 全部样式，mobile-first
  components/
    Home.jsx            # 首页（/）
    AlbumDetail.jsx     # 专辑详情（/album/:albumId）
    PlayerBar.jsx       # 底部固定播放控制条
```

## 数据说明

歌曲数据在构建时由根目录的 `list.js` 解析生成 `src/db.json`，运行时直接 import 静态 JSON，不做任何运行时解析。

`list.js` 原始格式：

```js
var list = [
  { name: "歌曲名", artist: "专辑-专辑名", url: "音频地址", cover: "封面地址" }
];
```

`artist` 字段中 `专辑-` 前缀会被去掉作为专辑名使用，**不要修改 `list.js` 的格式**。

## GitHub Pages 部署

推送到 `main` 分支后，GitHub Actions 自动执行：

```bash
npm ci && GITHUB_PAGES=true npm run build
```

构建时注入 `GITHUB_PAGES=true`，Vite 使用 `/lizhi_song_player/` 作为 `base`，产物发布到 GitHub Pages。

工作流文件：`.github/workflows/deploy-pages.yml`

## TODO

以下是计划中的体验优化，按优先级排列。

### 功能完整性

- [ ] **全屏播放器**：移动端点击播放栏弹出全屏视图，显示大封面、进度条（含时间文字）、shuffle/repeat 按钮——目前移动端无法操控这两个控件
- [ ] **播放失败自动跳曲**：音频加载失败后目前只打标记并停播，应自动跳到下一首

### 体验细节

- [ ] **进度条时间文字**：在进度条旁补充 `当前时间 / 总时长` 文字显示
- [ ] **动态 `document.title`**：播放中的曲目名实时反映到浏览器 Tab
- [ ] **音量持久化**：将音量存入 `localStorage`，刷新后恢复上次设置
- [ ] **图片懒加载**：首页专辑列表和歌单封面加 `loading="lazy"`

### 锦上添花

- [ ] **键盘快捷键**：桌面端 `Space` 暂停 / 播放，`←` / `→` 快进快退 10 秒，`M` 静音
- [ ] **搜索**：按歌曲名 / 专辑名过滤，直接找到目标曲目
