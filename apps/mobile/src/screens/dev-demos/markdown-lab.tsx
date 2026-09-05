import { MarkdownBody } from '@/components/ui'

import { LabScreen } from './lab-screen'

const markdownSample = `### 评论正文渲染

支持 **加粗**、*斜体*、~~删除线~~、\`行内代码\` 和 [链接](https://innei.in)。

> 引用一段别人的话，用来抬杠。

- 无序列表第一项
- 第二项，嵌套：
  - 子项

1. 有序列表
2. 第二条

\`\`\`ts
const answer = 42
console.log(answer)
\`\`\`

\`\`\`
pnpm --filter @yohaku/mobile start
\`\`\`

| 方案 | 结论 |
| --- | --- |
| WebView | 否决 |
| 原生渲染 | ✓ |

![示例图片](https://picsum.photos/seed/yohaku/600/320)
`

export function MarkdownLab() {
  return (
    <LabScreen intro="评论与思考里的正文渲染。" title="Markdown">
      <MarkdownBody markdown={markdownSample} />
    </LabScreen>
  )
}
