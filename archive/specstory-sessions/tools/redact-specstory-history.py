#!/usr/bin/env python3
"""Redact `.specstory/history` for public sharing.

Reference copy for the Yohaku OSS archive; the runnable path in a dev repo is
`scripts/redact-specstory-history.py` at repository root. See ./README.md here.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
HISTORY = REPO_ROOT / ".specstory/history"
STATS = REPO_ROOT / ".specstory/statistics.json"

# Sessions with no Shiroi codebase relevance (third-party product / external issue only).
DELETE_MARKDOWN = (
    "2026-03-19_13-50-07Z.md",  # Linear MCP / LobeHub cycle
    "2026-03-20_07-18-11Z-https-github-com-lobehub.md",  # external LobeHub GitHub issue
)

# Matching session UUIDs in statistics.json (from markdown headers).
DELETE_SESSION_IDS = (
    "7263ec71-d251-4f62-b4ab-f8b5fa2b0dc9",
    "d3abf4a9-c04a-46dc-adef-995d75e4c214",
)

MAX_LINE_CHARS = 4000


def redact_paths(s: str) -> str:
    s = s.replace("/Users/innei/git/innei-repo/Shiroi/", "<REPO_ROOT>/")
    s = s.replace("/Users/innei/git/innei-repo/Shiroi", "<REPO_ROOT>")
    s = s.replace("/Users/innei/git/innei-repo/", "<GIT_DIR>/")
    s = s.replace("/private/tmp/", "<TMP_DIR>/")
    s = s.replace("/Users/innei/", "<HOME>/")
    # HOME=/Users/innei, find /Users/innei -maxdepth … (no trailing slash)
    s = s.replace("/Users/innei", "<HOME>")
    # process list / env dumps
    s = re.sub(r"\bLOGNAME=innei\b", "LOGNAME=<USER>", s)
    s = re.sub(r"\bUSER=innei\b", "USER=<USER>", s)
    # GitHub org (not the public domain innei.ren / author name Innei)
    s = s.replace("innei-dev", "<GH_ORG>")
    # lsof / ps: `node      96690 innei   38u` → USER column
    s = re.sub(r"^(\S+\s+\d+\s+)innei(\s+)", r"\1<USER>\2", s, flags=re.MULTILINE)
    return s


def redact_url_signatures(s: str) -> str:
    # Linear CDN and similar: ?signature=eyJ... (JWT, three segments)
    return re.sub(
        r"signature=eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+",
        "signature=<REDACTED_URL_SIGNATURE>",
        s,
    )


def omit_long_lines(s: str) -> str:
    out: list[str] = []
    for line in s.splitlines():
        if len(line) > MAX_LINE_CHARS:
            out.append(
                f"<!-- [omitted {len(line)} chars — likely node_modules or generated bundle] -->"
            )
        else:
            out.append(line)
    return "\n".join(out)


def process_markdown(path: Path) -> bool:
    raw = path.read_text(encoding="utf-8", errors="replace")
    new = omit_long_lines(redact_url_signatures(redact_paths(raw)))
    if new != raw:
        path.write_text(new, encoding="utf-8")
        return True
    return False


def main() -> None:
    deleted = []
    for name in DELETE_MARKDOWN:
        p = HISTORY / name
        if p.exists():
            p.unlink()
            deleted.append(str(p.relative_to(REPO_ROOT)))

    if STATS.exists():
        data = json.loads(STATS.read_text(encoding="utf-8"))
        sessions = data.get("sessions")
        if isinstance(sessions, dict):
            for sid in DELETE_SESSION_IDS:
                sessions.pop(sid, None)
        STATS.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    updated = 0
    for path in sorted(HISTORY.glob("*.md")):
        if process_markdown(path):
            updated += 1

    print("deleted:", deleted or "(none)")
    print("markdown files updated:", updated)


if __name__ == "__main__":
    main()
