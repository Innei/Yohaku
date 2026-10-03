import { useMemo } from 'react'

import { AppText } from '@/components/ui'
import { openExternalUrl } from '@/lib/open-external'
import { MarkdownDocument } from '@/rich/markdown/markdown-document'
import { markdownArticle } from '@/rich/markdown/parse'

import { LabScreen } from './lab-screen'

const articleSample = `# 原生 Markdown 文章

这篇文章以 Markdown 存储，由 md4c 解析后交给与 Lexical 文章相同的原生视图绘制。
同一段落里的软换行
不会在中文之间留下空格。

行内标记：**加粗**、*斜体*、~~删除线~~、\`行内代码\`、==高亮==、||剧透||、[链接](https://innei.in)、行内公式 $e^{i\\pi} + 1 = 0$。提及 {GH@Innei}，插入 ++新增内容++，脚注[^md4c]。

## 列表

- 无序列表第一项
  - 嵌套一层
- 第二项

1. 安装依赖：

   \`\`\`sh
   pnpm install
   \`\`\`

2. 启动应用

- [x] 已完成的任务
- [ ] 未完成的任务

### 引用

> 引用以衬线体排印，
> 比正文安静一档。

> [!NOTE]
> 以 \`[!NOTE]\` 开头的引用会成为提示块。

---

## 区块

\`\`\`ts
const heading = (node, key, children) =>
  textBlockElement({ role: 'heading' }, key, children)
\`\`\`

| 语法 | 节点 | 绘制 |
| --- | --- | --- |
| \`# 标题\` | heading | TextKit |
| \`$$…$$\` | 块公式 | SwiftMath |

$$
\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}
$$

![替代文字即图注](https://picsum.photos/seed/yohaku/1200/800)

\`\`\`mermaid
graph LR
  Markdown --> AST --> Views
\`\`\`

https://github.com/mity/md4c

## 容器

::: warning
容器内的内容同样按 Markdown 解析，**标记**照常生效。
:::

::: gallery
![一](https://picsum.photos/seed/yohaku-a/900/600)
![二](https://picsum.photos/seed/yohaku-b/900/600)
![三](https://picsum.photos/seed/yohaku-c/900/600)
:::

<details><summary>原始 HTML</summary>不解析，按源文本显示。</details>

[^md4c]: md4c 遵循 CommonMark 与 GFM，二者都没有定义脚注，因此由预处理提取。
`

export function MarkdownArticleLab() {
  const article = useMemo(() => markdownArticle(articleSample), [])
  return (
    <LabScreen
      intro="Markdown 文章经 md4c 解析，渲染成与 Lexical 文章相同的原生 segments。"
      title="Markdown 文章"
    >
      {article ? (
        <MarkdownDocument
          article={article}
          variant="article"
          onLinkPress={(url) => void openExternalUrl(url)}
        />
      ) : (
        <AppText variant="secondary">当前二进制不含 Markdown 解析器</AppText>
      )}
    </LabScreen>
  )
}
