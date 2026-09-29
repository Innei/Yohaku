import type { SerializedEditorState } from 'lexical'

const blocks: Array<[language: string, code: string]> = [
  ['ts', "interface User { id: number; name?: string }\nexport async function load(id: number): Promise<User> {\n  const res = await fetch(`/api/users/${id}`)\n  return (await res.json()) as User\n}"],
  ['tsx', "export function Card({ title }: { title: string }) {\n  const [open, setOpen] = useState(false)\n  return <button onClick={() => setOpen(!open)}>{title}</button>\n}"],
  ['js', "import { readFile } from 'node:fs/promises'\nconst data = JSON.parse(await readFile('a.json', 'utf8'))\nconsole.log(data.items.map((x) => x * 2), /ab+c/gi)"],
  ['bash', 'set -euo pipefail\nfor f in *.log; do\n  echo "compressing $f"\n  gzip -9 "$f"\ndone'],
  ['json', '{\n  "name": "yohaku",\n  "private": true,\n  "version": 3,\n  "tags": ["a", null]\n}'],
  ['swift', 'struct Post: Decodable {\n  let id: String\n  var title: String?\n}\n\nfunc load() async throws -> [Post] {\n  try await api.get("posts")\n}'],
  ['css', '.card:hover > .title {\n  color: #0a3069;\n  margin: 0 auto;\n  transition: opacity 0.2s ease;\n}'],
  ['yaml', 'services:\n  web:\n    image: "node:20"\n    ports:\n      - 3000:3000\n    restart: always'],
  ['html', '<!doctype html>\n<html lang="en">\n  <style>body { margin: 0 }</style>\n  <script>let count = 1</script>\n  <p class="lead">Hello</p>\n</html>'],
  ['python', 'from dataclasses import dataclass\n\n@dataclass\nclass Point:\n    x: float = 0.0\n\n    def norm(self) -> float:\n        return abs(self.x)  # distance'],
  ['diff', '--- a/app.ts\n+++ b/app.ts\n@@ -1,3 +1,3 @@\n-const port = 3000\n+const port = 8080\n export default port'],
  ['xml', '<?xml version="1.0" encoding="UTF-8"?>\n<plist version="1.0">\n  <dict><key>Name</key><string>Yohaku</string></dict>\n</plist>'],
  ['toml', '[package]\nname = "yohaku"\nversion = "0.1.0"\n\n[dependencies]\nserde = { version = "1", features = ["derive"] }'],
  ['dockerfile', 'FROM node:20-alpine AS build\nWORKDIR /app\nCOPY . .\nRUN pnpm install --frozen-lockfile\nCMD ["node", "dist/main.js"]'],
  ['lua', 'local function greet(name)\n  if not name then return nil end\n  return "hi " .. name\nend\nprint(greet("lua"))'],
  ['go', 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfor i := 0; i < 3; i++ {\n\t\tfmt.Println("tick", i)\n\t}\n}'],
  ['java', 'public final class App {\n  public static void main(String[] args) {\n    var list = List.of(1, 2, 3);\n    System.out.println(list.size());\n  }\n}'],
  ['c', '#include <stdio.h>\n\nint main(void) {\n  const char *name = "c";\n  printf("hello %s\\n", name);\n  return 0;\n}'],
  ['md', '# Release notes\n\nSome **bold** and *italic* text with `inline` code.\n\n```ts\nconst answer: number = 42\n```\n'],
  ['rust', 'fn main() {\n    let items: Vec<i32> = vec![1, 2, 3];\n    let sum: i32 = items.iter().sum();\n    println!("sum = {}", sum);\n}'],
  ['php', '<?php\nnamespace App;\n\nfunction greet(string $name): string {\n    return "Hello, " . $name;\n}\n?>\n<p><?= greet("php") ?></p>'],
  ['sql', 'select id, title from posts where published = true -- not bundled, stays plain'],
]

export const codeHighlightSample: SerializedEditorState = {
  root: {
    children: blocks.map(([language, code]) => ({
      code,
      language,
      type: 'code-block',
      version: 1,
    })),
    direction: null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
} as unknown as SerializedEditorState
