<div align="center">

# Yohaku for Android

_余白 / Yohaku 的 Android 版本 —— 一个只读取你自己博客的原生客户端。_

[上游 iOS 版本](https://github.com/Innei/Yohaku) · [移植说明](./apps/mobile/README.android.md) · MIT

</div>

---

## 这是什么

这是 [Yohaku](https://github.com/Innei/Yohaku) 的 **Android 移植版**。

Yohaku 是 Innei 做的一套面向个人写作的跨端出版产品：以 [mx-space/core](https://github.com/mx-space/core)
为内容后端，呈现文章、手记、思考与时间线。上游仓库公开发布的是 **iOS 客户端**
（App Store 上那个 Yohaku 的源码，MIT 许可），没有 Android 版本。

本仓库在它的代码基础上补齐了 Android：

- 原生工程、权限、深链、自适应图标（Android 8.0+ / API 26）
- 导航与排版按 Android 的度量重算（全屏登录页、折叠标题、边缘模糊过渡）
- 登录链路：邮箱 / 社交 / 登出三处 Android 行为差异的修复
- 正文渲染：优先 Markdown，并补上 Lexical 缺失的节点注册（`link`）

**iOS 的行为没有改动**，所有 Android 差异都通过 `Platform.OS` 分支或 `index` 派发隔离。

> 本仓库是非官方移植，由社区维护，不代表 Innei 或 Yohaku 官方。
> 上游的版权、设计与代码归 Innei 所有；本仓库同样以 MIT 发布，并保留完整的上游提交历史。

## 与上游的关系

| 项目 | [Innei/Yohaku](https://github.com/Innei/Yohaku) | 本仓库 |
| --- | --- | --- |
| 平台 | iOS 18+ | iOS + **Android 8.0+** |
| 站点配置 | `apps/mobile-overlay/` 覆盖 | 新增 `apps/mobile/site.config.json`，单文件 |
| 登录 | YohakuKit（ASWebAuthenticationSession） | Android 走 Custom Tabs + `Linking` 回跳 |
| 正文渲染 | Lexical 原生块 | 优先 Markdown，Lexical 兜底 |

逐项改动、构建方式与已知差异见 [`apps/mobile/README.android.md`](./apps/mobile/README.android.md)。

## 当前构建的站点

| 项 | 值 |
| --- | --- |
| App 名称 | 春雪日记dsh |
| 前台 | https://blog.imikufans.com |
| API | https://blog.imikufans.com/api/v3 |
| Android 包名 | `com.imikufans.chunxue` |

换站点只需要改 `apps/mobile/site.config.json`，然后重新 `expo prebuild`。

## 构建

需要 Node 20+、pnpm、JDK 17、Android SDK Platform 37。

```bash
pnpm install
cd apps/mobile

npx expo prebuild -p android --clean

cd android
./gradlew :app:assembleRelease
```

产物：`apps/mobile/android/app/build/outputs/apk/release/app-release.apk`

- ABI 集合由 `YOHAKU_ANDROID_ABIS` 控制，默认 `arm64-v8a,x86_64`。
- Windows 上 CMake 中间目录由 `YOHAKU_CMAKE_STAGING` 控制（默认 `android/.cxx-staging`，规避 MAX_PATH）。
- 本地没配签名时，可先把 `android/app/build.gradle` 的 `signingConfigs.release` 指向 debug keystore；正式发布请换成自己的 keystore。

## 想把你自己的 Yohaku 博客打包成 App？

本仓库绑定的是作者自己的站点。给别人用的是这份模板：

**[Yohaku App for Android](https://github.com/syskuku/Yohaku-App-for-Android)** —— fork 后改一个
`site.config.json`，`expo prebuild` + `gradlew assembleRelease` 就能出包，README 里有完整的
配置字段、后端要求与常见问题。

## 许可证

MIT，与原项目一致。

- Copyright © 2026 Innei（上游 `apps/mobile/`、`packages/rich-content/`、`design-system/`）
- Android 移植部分的改动同样以 MIT 发布
- 仓库内其余内容（README、截图等）遵循上游的 CC BY-NC-SA 4.0
