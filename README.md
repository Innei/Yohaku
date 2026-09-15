# PR #48 视觉证据 — native article body renderer

- 基线：`b32430d`（Innei/Yohaku#48 的 head，即 `feat/native-rich-body`）。
- 设备：iPhone 17 Pro 模拟器 / iOS 26.5；Debug 构建（保留签名设置），页面为 app 内 dev-demos 离线验收页。
- 本轮只覆盖渲染与交互本身；未使用真实账号、云端数据或真机。

## 文件

| 文件 | 内容 |
| --- | --- |
| `light-rich-text.mp4` / `.gif` | `/dev-demos/rich-text`（浅色）：原生正文渲染 → 长按文字唤出原生编辑菜单（自定义项「评论 / 评论此段」）→ 点「评论」→ events 日志回传选区 `menu: comment p1:39 → p1:41 "行内"` → 点已有高亮 → `events: highlight c1` |
| `light-rich-document-linkcard.mp4` / `.gif` | `/dev-demos/rich-document`（浅色，「链接卡/引用/对话/文件」样张）：`mx.innei.in` 的真实文章 lexical JSON → haklex override → 原生 segments，含链接卡 |
| `light-rich-document-mermaid.mp4` / `.gif` | 同上页面，「mermaid/表格/alert」样张 |
| `dark-rich-text.mp4` / `.gif` | `/dev-demos/rich-text`（深色）：选区与编辑菜单在深色下的表现 |
| `light-select-menu.png` | 浅色静态帧：原生编辑菜单（「评论 / 评论此段 / 拷贝 / 查询」） |
| `light-comment-log.png` | 浅色静态帧：events 日志中的选区回传与高亮事件 |
| `dark-select-menu.png` | 深色静态帧：同一菜单 |
| `light-document.png` | 浅色静态帧：真实文章 JSON 的原生渲染 |

## 复现

1. `pnpm --filter @yohaku/mobile ios`（Simulator Debug；不要关闭签名，见 `apps/mobile/AGENTS.md`）。
2. `xcrun simctl openurl booted "yohaku:///dev-demos/rich-text"`（或 `.../rich-document`）。
3. 长按正文任意文字：菜单里的「评论」「评论此段」由 `RichTextView` 的 `menuItems` 提供，点选后原生把 block/offset 选区回传给 JS，显示在页面底部的 events 日志里。

GIF 只用于在 PR 内直接查看；完整画质以同目录 MP4（H.264, 720p）为准。
