# 脱敏脚本说明

`redact-specstory-history.py` 与 Yohaku 私有实现仓库中 `scripts/redact-specstory-history.py` 保持一致，用于在**完整开发工作区**（存在 `.specstory/history` 与 `.specstory/statistics.json`）上对 SpecStory 导出再做一轮脱敏。

本 OSS 仓库**不包含** `.specstory/` 目录；此处文件仅供对照「公开前做了哪些替换」。若你在本地复用，请将脚本放在 monorepo 根目录的 `scripts/` 下并自仓库根运行：

```bash
python3 scripts/redact-specstory-history.py
```
