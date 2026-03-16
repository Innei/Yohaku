# 余白 / Yohaku

**[简体中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md)**

> *The blank space is part of the writing.*

**Yohaku** (余白) is a Japanese word meaning *negative space* — the intentional emptiness that gives everything else its weight.

This is a design language and visual system for a personal blog, built around the metaphor of *Writing · Letter Paper · Light and Shadow*. It is not a feature list. It is an answer to the question: how do you make reading happen?

---

## Design Philosophy

The entire site uses **personal writing** as its metaphor. A page unfolds like a letter being opened — text and silence together form the rhythm, content scattered like notes in a journal, never forced into a rigid information grid. When you read, your eyes lead. The page follows.

**Color is restrained.** In light mode, the background approaches the off-white of real paper — easy on the eyes. Dark mode sinks into warm gray, like reading a letter by a small lamp at night. Accent color appears only within the content itself. Buttons, navigation, borders — all quietly step back, asking not to be noticed.

**Animation breathes.** The page unfolds gently as you scroll. Elements don't pop — they surface, like turning a fresh page. On desktop, some elements carry a faint idle breathing, as if stillness itself is alive. On first visit, a full entrance sequence plays. Return visits skip it — no repetition, no interruption.

**Typography has texture.** Headings use serif fonts, carrying the weight of ink on paper. Annotations and dates appear in italic serif, like margin notes scribbled in a corner. The base size is deliberately small; reading density is low. Space is given back to the content.

**Interaction is quiet.** No floating color blocks. No jumping highlights. Hover states deepen color slightly — like a finger pressing gently against paper. Every response says: *I noticed you* — not *look over here*.

---

## Getting the Full Implementation

The complete codebase is maintained as a private repository at [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku), deeply rebuilt from [Shiro](https://github.com/Innei/Shiro).

**Sponsorship grants access to the private repository.**

[![Sponsor](https://img.shields.io/badge/Sponsor-Innei-ea4aaa?logo=github-sponsors&logoColor=white)](https://github.com/sponsors/Innei)

After sponsoring at [github.com/sponsors/Innei](https://github.com/sponsors/Innei), open an [Issue](https://github.com/Innei/Yohaku/issues) or send an email with your GitHub username — I'll add you to the repository manually.

This public repository serves as an open archive of the design language, documenting visual specs and design decisions.

---

## Design Spec at a Glance

| Token | Light | Dark |
|-------|-------|------|
| Accent | 浅葱 `#33A6B8` | 桃 `#F596AA` |
| Background | `#fefefb` (paper white) | `rgb(28,28,30)` (warm night) |
| Easing | `cubic-bezier(0.22, 1, 0.36, 1)` | same |
| Base font size | 14px | same |

---

## Related Projects

- [Shiro](https://github.com/Innei/Shiro) — Open-source predecessor, Next.js personal blog system
- [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku) — Full closed-source implementation (sponsor for access)

---

## License

2024 Innei. This repository is licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
