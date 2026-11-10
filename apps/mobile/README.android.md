# Yohaku · Android

把 [Yohaku](https://github.com/Innei/Yohaku)（原仓库只发布 iOS 客户端）移植到 Android 的说明。
Android 侧的代码全部走 `Platform.OS` 分支或 `index` 派发，**没有改动 iOS 的任何行为**。

- 最低版本：Android 8.0（API 26）
- 编译 SDK：37 / 目标 SDK：36
- 技术栈：Expo SDK 58 · React Native 0.88 · Hermes · New Architecture · Expo Router

配置只有一个入口：`apps/mobile/site.config.json`。

```json
{
  "appName": "Yohaku",
  "androidPackage": "dev.yohaku.android",
  "bundleId": "dev.yohaku.app",
  "scheme": "yohaku",
  "siteUrl": "https://example.com",
  "apiUrl": "https://example.com/api/v3",
  "privacyUrl": "",
  "siteHosts": ["example.com"]
}
```

| 字段 | 说明 |
| --- | --- |
| `appName` | 桌面图标下的名字 |
| `androidPackage` | Android 包名，**上架后不可更改** |
| `bundleId` | iOS bundle id，Android 构建不使用 |
| `scheme` | 自定义 URL scheme，登录回跳用，需与后端一致 |
| `siteUrl` | 站点前台地址，用于站内链接与深链 |
| `apiUrl` | mx-core 的 API 根地址，通常是 `站点地址/api/v3` |
| `privacyUrl` | 留空则用 `siteUrl + /privacy` |
| `siteHosts` | 该站点的域名列表，用于把 https 链接收进 App |

## 构建

```bash
pnpm install
cd apps/mobile

# 生成原生工程（app.config.ts 会把 site.config.json 写进 Android 清单）
npx expo prebuild -p android --clean

# 本地出包
cd android
JAVA_HOME=/path/to/jdk17 ./gradlew :app:assembleRelease
```

产物在 `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`。

首次 release 构建需要一个签名配置；本地调试可直接把 `android/app/build.gradle`
的 `signingConfigs.release` 指向 debug keystore，正式发布请换成自己的 keystore。

## Android 侧做了什么

### 构建与原生

- `app.config.ts` 增加 `android` 段：包名、versionCode、自适应图标、`intentFilters`
  （https 站点域名 + 自定义 scheme 深链）、权限白名单、被屏蔽的无用权限。
- `plugins/with-android-gradle-properties.cjs`：把构建所需的 gradle 属性写进
  `gradle.properties`，避免每次 prebuild 后手改。
- `expo-web-browser`：iOS 用 YohakuKit 的 `ASWebAuthenticationSession`，通过 Metro
  shim 替换；Android 使用 autolink 进来的真实模块（Custom Tabs）。shim 只在
  `platform === 'ios'` 时生效。
- `expo-glass-effect` / `expo-symbols` 只有 iOS 实现，Android 走 RN 版 shim。

### 导航与视觉

- 登录页在 Android 用 `fullScreenModal`（`formSheet` 在 Android 上不会屏蔽下层点击，
  会导致按钮"点了没反应"）。
- 折叠标题栏按 Android 的字体度量重新计算：标题居中、右侧按钮前省略、上下留白对齐。
- 返回/更多按钮的点击热区做成左右对称。
- 内容滚到标题栏下方时的边缘模糊过渡在 Android 上用渐变遮罩实现。
- 搜索框在 Android 上额外上移，避开输入法联想条。

### 登录

三个独立问题，都是 Android 与 iOS 的行为差异导致的：

1. **邮箱登录一直提示密码错误**。RN 的 `fetch` 在 Android 上不暴露 `set-cookie`，
   `@better-auth/expo` 插件因此拿不到 session。服务端用
   `access-control-expose-headers: set-auth-token` 暴露了同一个 token，
   客户端改为读该响应头并自己拼 `__Secure-better-auth.session_token`（`direct-auth.ts`）。
2. **社交登录回跳后仍是未登录**。改为应用启动时安装一次全局 `Linking` 监听
   （并在 `AppState` 恢复前台时补读 `getInitialURL()`），回跳 cookie 在任何
   `await` 之前同步落盘（`social-flow.ts`）。
3. **退不出登录**。插件的 `signOut()` 失败时不会清理本地状态，改用
   `signOutDirect()`，无论服务端结果如何都清空本地 cookie 与缓存（`direct-signout.ts`）。

> 登录链路依赖后端的 mx-core（better-auth）开启 expo 插件并暴露
> `set-auth-token`，以及 `/auth/expo-authorization-proxy` 端点。

### 正文渲染

- 接口同时返回 `text`（Markdown）与 `content`（Lexical JSON）。Android 上文章正文
  **优先使用 Markdown**，因为 Lexical 渲染链路在 RN 下不稳定。
- 同时补上了 `@lexical/link` 的 `LinkNode` / `AutoLinkNode` 注册：正文里只要出现
  `link` 节点，未注册时 Lexical 会**整篇解析失败**（静默空白）。
- 增加错误边界与"渲染结果为空则降级 Markdown"的兜底，任何未知节点都不会再出现空白页。

## 已知差异

- 部分 iOS 专属的动效（玻璃、SF Symbols、Live Activity）在 Android 上退化为静态效果。
- 打印/导出 PDF 走的是 RN 侧实现，排版与 iOS 不完全一致。
- Android 上的分享单使用系统 `Intent`，目标与应用列表有关。

## 许可

MIT。Android 移植部分同样以 MIT 发布。原项目版权归 [Innei](https://github.com/Innei) 所有。
