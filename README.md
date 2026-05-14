# 李志音乐播放器

Apple Music 风格的移动端优先网页播放器，使用 React + Vite 构建。

在线访问：https://roy2100.github.io/lizhi_song_player/

## 版权声明

本项目仅用于前端学习、React/Vite 实践和 UI 交互效果研究，不用于商业用途。

项目中展示的歌曲、封面、专辑名称等内容版权归原权利人所有。本项目不主张拥有相关音乐、图片或文字内容的版权。如相关权利人认为页面内容不应展示，请联系仓库维护者处理。

请勿将本项目用于未经授权的音乐传播、下载分发或商业运营。

## 功能

- 移动端优先布局，渐进增强到桌面宽屏
- 首页：Hero 艺人卡片、播放排行榜、代表专辑、专辑横向滚动列表（按年份排序）
- 专辑详情页：曲目列表 + 静态时长显示
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
- Vitest（单元测试）
- 原生 CSS，mobile-first

## 本地开发

```bash
npm ci           # 安装依赖（锁定版本）
npm run dev      # 启动开发服务器（0.0.0.0:5173，局域网可访问）
npm run build    # 生产构建，输出到 dist/
npm run preview  # 本地预览构建产物（0.0.0.0:4173）
npm test         # 运行单元测试
```

提交前务必运行 `npm run build` 确认无构建错误。

## 项目结构

```
src/
  main.jsx              # 入口，挂载 HashRouter + App
  App.jsx               # 全局状态 + 路由表 + 音频元素 + MediaSession
  db.json               # 歌曲数据（唯一数据源，直接编辑）
  utils.js              # 纯函数：数据规范化、格式化、排序、随机选曲
  utils.test.js         # 单元测试
  styles.css            # 全部样式，mobile-first
  components/
    AlbumCard.jsx       # 专辑卡片（封面、名称、年份、可选播放按钮）
    AlbumDetail.jsx     # 专辑详情（/album/:albumId）
    Home.jsx            # 首页（/）
    PlayerBar.jsx       # 底部固定播放控制条
audio/                  # 本地音频文件（由 CDN 托管，不参与构建）
```

## 数据说明

`src/db.json` 是唯一数据源，由 `App.jsx` 直接 `import` 加载，构建时打包进 bundle。

格式：

```json
{
  "albums": [
    {
      "name": "专辑名",
      "cover": "封面 URL",
      "year": 2018,
      "tracks": [
        { "name": "歌曲名", "url": "音频 URL", "duration": 180.5 }
      ]
    }
  ]
}
```

运行时 `normalizeAlbums()` 将 `db.json` 的紧凑格式展开为完整 track 对象（补充 `id`、`albumName`、`cover`、`artist` 字段）。

音频和封面托管在 GitHub：`raw.githubusercontent.com/roy2100/lizhi_song_player/v1.0-aac/audio/...`

## GitHub Pages 部署

推送到 `main` 分支后，GitHub Actions 自动执行：

```bash
npm ci && GITHUB_PAGES=true npm run build
```

构建时注入 `GITHUB_PAGES=true`，Vite 使用 `/lizhi_song_player/` 作为 `base`，产物发布到 GitHub Pages。

工作流文件：`.github/workflows/deploy-pages.yml`

## TODO

- [ ] **全屏播放器**：移动端点击播放栏弹出全屏视图，显示大封面、进度条、shuffle/repeat 按钮
- [ ] **播放失败自动跳曲**：音频加载失败后自动跳到下一首
- [ ] **进度条时间文字**：在进度条旁补充 `当前时间 / 总时长` 文字显示
- [ ] **动态 `document.title`**：播放中的曲目名实时反映到浏览器 Tab
- [ ] **音量持久化**：将音量存入 `localStorage`，刷新后恢复
- [ ] **键盘快捷键**：桌面端 `Space` 暂停 / 播放，`←` / `→` 快进快退 10 秒
