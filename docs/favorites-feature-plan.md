# 收藏功能实现计划

## 背景

用户截图中 AlbumDetail 页面专辑操作区的第三格（shuffle 按钮 | 播放按钮 | **空格**）当前空白，需填入收藏按钮。全局同步实现单曲/专辑收藏，并提供独立收藏列表页。

---

## 一、功能范围

| # | 功能点 | 位置 |
|---|--------|------|
| 1 | 收藏/取消收藏当前播放曲目 | PlayerBar（移动端心形按钮） |
| 2 | 收藏/取消收藏单首歌曲 | AlbumDetail 歌曲行、首页排行榜行 |
| 3 | 一键收藏/取消收藏整张专辑 | AlbumDetail hero 操作区第三格（图中红框） |
| 4 | 收藏列表页 | 新路由 `/favorites` |
| 5 | 首页入口 | Home 页顶部「我的收藏」快捷入口（有收藏时显示） |

---

## 二、数据设计

### 存储结构

```ts
// localStorage key: "lizhi_favorites"
type Favorites = Record<string, true>   // key = track.id，存在即代表已收藏
```

### utils.js 新增函数

```ts
export const FAVORITES_KEY = "lizhi_favorites";

// 加载收藏数据
export function loadFavorites(): Favorites

// 持久化收藏数据
export function saveFavorites(favorites: Favorites): void

// 切换单首歌曲收藏状态，返回新的 favorites 对象
export function toggleFavorite(favorites: Favorites, trackId: string): Favorites

// 判断专辑是否全部已收藏（用于专辑按钮高亮）
export function isAlbumFullyFavorited(favorites: Favorites, tracks: Track[]): boolean

// 批量收藏专辑所有曲目（幂等）
export function favoriteAlbum(favorites: Favorites, tracks: Track[]): Favorites

// 批量取消收藏专辑所有曲目
export function unfavoriteAlbum(favorites: Favorites, tracks: Track[]): Favorites

// 从 favorites + tracks 过滤出已收藏的 Track 数组（供收藏页使用）
export function getFavoriteTracks(favorites: Favorites, allTracks: Track[]): Track[]
```

### App.jsx 状态

```jsx
// 新增
const [favorites, setFavorites] = useState(() => loadFavorites());

function toggleFavoriteTrack(trackId) {
  setFavorites((prev) => {
    const next = toggleFavorite(prev, trackId);
    saveFavorites(next);
    return next;
  });
}

function toggleFavoriteAlbum(album) {
  setFavorites((prev) => {
    const fullyFav = isAlbumFullyFavorited(prev, album.tracks);
    const next = fullyFav
      ? unfavoriteAlbum(prev, album.tracks)
      : favoriteAlbum(prev, album.tracks);
    saveFavorites(next);
    return next;
  });
}
```

---

## 三、UI 变更明细

### 3.1 AlbumDetail — 专辑操作区（图中红框）

**当前布局**（`album-actions`，3 列 grid）：

```
[ Shuffle ] [ ▶ 播放 ] [ 空 ]
```

**目标**：

```
[ Shuffle ] [ ▶ 播放 ] [ ♥ 收藏 ]
```

- 图标：`Heart`（lucide-react），已收藏时 `fill="currentColor"` + `color: var(--accent)`
- 专辑全部收藏时：心形实心红色
- 专辑部分或未收藏时：心形空心灰色
- 点击逻辑：全部已收藏 → 取消全部；否则 → 收藏全部

Props 新增：

```jsx
// AlbumDetail.jsx
onToggleFavoriteAlbum,   // (album) => void
onToggleFavoriteTrack,   // (trackId) => void
favorites,               // Record<string, true>
```

### 3.2 AlbumDetail — 歌曲行

`.song-row` 当前 grid：`32px minmax(0,1fr) 44px 24px`

最后一列（24px）目前为 `.song-more`（空占位），替换为 Heart 小图标。

- 激活行（`is-active`）：白色透明心形
- 已收藏（非激活）：红色实心心形
- 未收藏（非激活）：灰色空心心形
- 点击：`stopPropagation()` + 调用 `onToggleFavoriteTrack(track.id)`

### 3.3 PlayerBar — 移动端收藏按钮

移动端 `player-controls` 当前从左到右（mobile）：
`[ ▶ 播放 ]  [ ⏭ 下一首 ]  [ ☰ 队列 ]`

在 `queue-toggle-btn` 左侧插入 Heart 按钮，**仅移动端显示**（`.mobile-only`）：

```
[ ▶ 播放 ]  [ ⏭ 下一首 ]  [ ♥ 收藏 ]  [ ☰ 队列 ]
```

- 代表当前播放曲目的收藏状态
- 样式复用 `.player-controls button`，激活时 `color: var(--accent)`

Props 新增：

```jsx
// PlayerBar.jsx
favorites,               // Record<string, true>
onToggleFavoriteTrack,   // (trackId) => void
```

### 3.4 Home — 排行榜行收藏图标

`.chart-item` 当前 grid：`44px minmax(0,1fr) 24px`

最后一列（24px，目前 `.chart-more` 空占位）替换为 Heart 图标，行为同 3.2。

Props 新增：

```jsx
// Home.jsx
favorites,
onToggleFavoriteTrack,
```

### 3.5 收藏列表页 `/favorites`

新建 `src/components/Favorites.jsx`：

- 样式参照 `AlbumDetail` 的 `song-list`
- 页面结构：
  ```
  [ ← 返回 ]
  「我的收藏」标题 + 收藏曲目数
  [ ▶ 播放全部 ] [ 随机播放 ]
  歌曲列表（可播放，可取消收藏）
  空状态：「还没有收藏的歌曲，去发现喜欢的歌曲吧~」
  ```
- 路由：`/favorites`（在 `App.jsx` 的 `<Routes>` 注册）

### 3.6 Home — 收藏入口

在「歌曲排行」section 上方插入快捷入口，**仅当 `favorites` 非空时渲染**：

```
─────────────────────────────────────────
[ ♥ ]  我的收藏               N 首  >
─────────────────────────────────────────
```

点击跳转 `/favorites`。

---

## 四、CSS 变更

```css
/* 收藏按钮通用（歌曲行 / 排行榜） */
.fav-btn {
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--muted);
  transition: color 0.15s ease;
}

.fav-btn.is-fav {
  color: var(--accent);
}

/* 专辑 hero 收藏（btn-icon 复用，激活色覆盖） */
.btn-icon.is-fav {
  color: var(--accent);
}

/* 移动端专用显示 */
.mobile-only {
  display: grid !important;
}

@media (min-width: 720px) {
  .mobile-only {
    display: none !important;
  }
}

/* 收藏页 */
.favorites-view {
  width: min(100%, 1180px);
  margin: 0 auto;
}

.favorites-empty {
  padding: 60px 24px;
  text-align: center;
  color: var(--muted);
}

/* 首页收藏入口 */
.favorites-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 52px;
  padding: 0;
  border: 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  background: transparent;
  text-align: left;
}

.favorites-entry-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(250, 35, 59, 0.1);
  color: var(--accent);
  flex-shrink: 0;
}

.favorites-entry-label {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
}

.favorites-entry-count {
  color: var(--muted);
  font-size: 13px;
}
```

---

## 五、Props 传递汇总

```
App
 ├─ favorites (state)
 ├─ toggleFavoriteTrack (fn)
 ├─ toggleFavoriteAlbum (fn)
 │
 ├── Home
 │     favorites, onToggleFavoriteTrack, onOpenFavorites
 │
 ├── AlbumDetail
 │     favorites, onToggleFavoriteTrack, onToggleFavoriteAlbum
 │
 ├── PlayerBar
 │     favorites, onToggleFavoriteTrack
 │
 └── Favorites（新页面）
       favorites, allTracks, currentTrack, isPlaying,
       onBack, onPlayTrack, onToggleFavoriteTrack
```

---

## 六、文件改动清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/utils.js` | 修改 | 新增 6 个 favorites 工具函数 |
| `src/App.jsx` | 修改 | 新增 `favorites` state、两个 toggle 函数；路由注册 `/favorites`；下传 props |
| `src/components/PlayerBar.jsx` | 修改 | 移动端新增 Heart 按钮 |
| `src/components/AlbumDetail.jsx` | 修改 | 专辑操作区第三格 + 歌曲行收藏图标 |
| `src/components/Home.jsx` | 修改 | 排行榜收藏图标 + 收藏入口条目 |
| `src/components/Favorites.jsx` | 新建 | 收藏列表页 |
| `src/styles.css` | 修改 | 新增收藏相关样式类 |

---

## 七、实现顺序

1. **`utils.js`**：纯函数，无副作用，先实现可单独测试
2. **`App.jsx`**：挂载 state + 函数，注册路由
3. **`Favorites.jsx`**：新页面，独立组件
4. **`AlbumDetail.jsx`**：专辑操作区（图中红框）+ 歌曲行
5. **`PlayerBar.jsx`**：移动端收藏按钮
6. **`Home.jsx`**：排行榜图标 + 首页入口
7. **`styles.css`**：样式补全

---

## 八、边界情况

| 情况 | 处理 |
|------|------|
| 收藏数据损坏（非 object） | `loadFavorites()` catch 返回 `{}` |
| localStorage 不可用（隐私模式） | saveFavorites try/catch，静默失败 |
| 收藏了已从 db.json 删除的曲目 | `getFavoriteTracks` 过滤时自动忽略找不到的 id |
| 收藏页无收藏 | 显示空状态提示，隐藏播放/随机按钮 |
| 歌曲行 Heart 按钮触发行播放 | `e.stopPropagation()` 阻止冒泡 |
