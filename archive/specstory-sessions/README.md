# SpecStory 开发会话存档

本目录收录 Yohaku 完整实现（私有仓库）日常开发过程中，通过 [SpecStory](https://docs.specstory.com/) 从编辑器会话导出的 Markdown 记录。内容以**实现细节、代码讨论与工具调用**为主，可作为「如何从 Shiro 系栈迭代到 Yohaku」的过程参考，**不是**设计规范本身；视觉与设计哲学仍以仓库根目录的 [README](../../README.md) 为准。

## 目录结构

| 路径 | 说明 |
|------|------|
| [`2025/`](./2025/) | 2025 年会话（文件名以 `YYYY-` 开头，时间为 UTC） |
| [`2026/`](./2026/) | 2026 年会话 |
| [`tools/redact-specstory-history.py`](./tools/redact-specstory-history.py) | 脱敏脚本副本，便于核对本地路径、URL 签名等如何被替换 |

文件名格式：`YYYY-MM-DD_HH-MM-SSZ-<简短主题>.md`（与 SpecStory 默认导出一致）。

## 隐私与脱敏

公开前已对导出内容做过一轮处理，包括但不限于：

- 本机绝对路径 → 占位符（如 `<REPO_ROOT>`、`<HOME>`、`<GIT_DIR>`）
- 第三方 URL 中带 `signature=` 的 JWT 形态参数 → `<REDACTED_URL_SIGNATURE>`
- 极长单行（多为 `node_modules` 或打包产物）→ 单行注释占位
- GitHub 组织名、进程列表中的系统用户名等 → 泛化占位符

若你自行从私有仓库重新导出，可对照 `tools/` 中的脚本做同样处理后再公开。

## 许可

与仓库根目录一致，见 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)。转载或摘录请注明出处。

---

**English.** This tree holds SpecStory-exported development session logs from the Yohaku implementation workspace. Files are grouped by **calendar year** (UTC prefix in filenames). See the table above for layout. Content is **redacted** for paths and sensitive URL fragments; see `tools/redact-specstory-history.py` for the replacement rules.
