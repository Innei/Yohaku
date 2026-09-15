# PR #190 视觉证据 — web AI Notice 行在窄屏折起

- PR：[innei-dev/yohaku#190](https://github.com/innei-dev/yohaku/pull/190) `feat(web): fold AI notice rows on mobile`
- 被验证的提交：`2cef5890a75d0ee2db712d0cf0eb7b21aaaf62dc`（PR head）
- 证据分支基线：`bb51fa3`（Innei/Yohaku `main`）；本分支只放证据文件，不含代码改动。

## 环境

| 项 | 值 |
| --- | --- |
| 构建 | PR head 工作区 `next dev`（Next.js 16.3.0 / Turbopack，`NODE_ENV=development`，`http://localhost:2437`） |
| 数据 | 本地 mx-core（`localhost:2333`），真实文章 `tech/skill-bundle-demo`（含 summary 与 skill bundle） |
| 驱动 | agent-browser 0.37.1 / Chrome for Testing 153.0.8010.36，CDP screencast，30 fps，`deviceScaleFactor=2` |
| 视口 | 移动 `390×844`；桌面 `1280×900`（`lg` 断点为 1024） |
| 页面 | 真实文章页 `/en/posts/tech/skill-bundle-demo`（`pageExtra.tsx` 集成）；demo `/dev-demos/notice-card-demo` 第 07 节（本 PR 的 test plan 指定页） |

## 文件

| 文件 | 内容 |
| --- | --- |
| `01-mobile-real-post.mp4` / `.gif` | 390 宽 · 真实文章页：AI 行默认折起，显示 `AI · Summary · AI skills` → 点击展开，露出 Summary 与 AI skills 两行 → 滚动看 skill bundle → 再次点击折回 |
| `02-desktop-real-post.mp4` / `.gif` | 1280 宽 · 同一文章页：**没有折叠条**，Summary 与 AI skills 直接两行全展开 |
| `03-mobile-demo.mp4` / `.gif` | 390 宽 · demo 第 07 节：折叠行 `AI · 关键洞察 · AI 技能` → 展开 → 折回；同卡片内过期 / 相关阅读 / 翻译三行不受影响 |
| `04-desktop-demo.mp4` / `.gif` | 1280 宽 · demo 第 07 节：无折叠条，`关键洞察` 与 `AI 技能` 两行直接铺开 |
| `05-mobile-demo-dark.mp4` / `.gif` | 390 宽 · 深色（`prefers-color-scheme: dark`）：折叠 / 展开 / 折回，含展开态新增的 `dark:max-lg:border-t` 分隔线 |
| `s1-mobile-real-folded.png` | 静态帧：390 宽真实文章页的默认折叠态 |
| `s2-mobile-real-expanded.png` | 静态帧：390 宽真实文章页展开态 |
| `s3-desktop-real.png` | 静态帧：1280 宽真实文章页（无折叠条） |
| `s4-mobile-demo-folded.png` | 静态帧：390 宽 demo 折叠态 |
| `s5-mobile-demo-expanded.png` | 静态帧：390 宽 demo 展开态 |
| `s6-desktop-demo.png` | 静态帧：1280 宽 demo（无折叠条） |

## 逐帧确认的运行时状态

录制前/后用 DOM 断言（`getComputedStyle`，非截图目测）核对，与录像一致：

| 场景 | 折叠按钮 | `aria-expanded` | 折叠内容 `grid-template-rows` |
| --- | --- | --- | --- |
| 390 真实文章页 · 初始 | `display: flex`，trail = `Summary · AI skills` | `false` | `0px` |
| 390 真实文章页 · 点击后 | 同上，chevron `rotate-180`，trail `opacity: 0` | `true` | `229.703px` |
| 390 真实文章页 · 再点击 | 同上 | `false` | `0px` |
| 1280 真实文章页 | `display: none` | — | `190.703px`（`lg:grid-rows-[1fr]`） |
| 390 demo 第 07 节 · 初始 | `display: flex`，trail = `关键洞察 · AI 技能` | `false` | `0px` |
| 1280 demo 第 07 节 | `display: none` | — | `260.578px` |
| 390 demo 第 07 节 · 深色 | `display: flex` | `false` | `0px` |

## 复现

1. 在 PR head 工作区起 web：`cd apps/web && NEXT_PUBLIC_API_URL=http://localhost:2333 NEXT_PUBLIC_GATEWAY_URL=http://localhost:2333 NODE_ENV=development ./node_modules/.bin/next dev -p 2437`（需本地 mx-core 在 2333）。
2. 390 宽打开 `/posts/tech/skill-bundle-demo` 或 `/dev-demos/notice-card-demo`，滚到第 07 节。
3. 点击 AI 行（`button[aria-expanded]`）展开 / 折起；把视口拉到 ≥1024 后折叠条消失，两行直接铺开。

GIF 只用于在 PR 内直接查看（GitHub 会剥离 `<video>`，实测）；完整画质以同目录 MP4（H.264）为准。
