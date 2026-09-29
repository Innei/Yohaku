#!/usr/bin/env node
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const mobileRoot = fileURLToPath(new URL('..', import.meta.url))
const iosRoot = path.join(mobileRoot, 'modules/yohaku/ios')
const podDir = path.join(iosRoot, 'Vendor/TreeSitter')
const codeDir = path.join(iosRoot, 'Code')
const queryDir = path.join(codeDir, 'Core/Queries')

const CORE = { repo: 'tree-sitter/tree-sitter', tag: 'v0.25.10' }
const SWIFT_TREE_SITTER = { repo: 'tree-sitter/swift-tree-sitter', tag: '0.10.0' }
const JS_FOR_TS = { repo: 'tree-sitter/tree-sitter-javascript', tag: 'v0.23.1' }

const q = (source, file) => ({ ...source, file })

// For the same node the later pattern wins (tree-sitter-highlight), so an extending
// language lists its base grammar's queries first.
const GRAMMARS = [
  {
    pod: 'TreeSitterTypeScript', repo: 'tree-sitter/tree-sitter-typescript', tag: 'v0.23.2', dir: 'typescript',
    header: 'bindings/swift/typescript', language: 'typescript',
    highlights: [q(JS_FOR_TS, 'queries/highlights.scm'), 'queries/highlights.scm'],
    injections: [q(JS_FOR_TS, 'queries/injections.scm')],
  },
  {
    pod: 'TreeSitterTSX', repo: 'tree-sitter/tree-sitter-typescript', tag: 'v0.23.2', dir: 'tsx',
    header: 'bindings/swift/tsx', language: 'tsx',
    highlights: [q(JS_FOR_TS, 'queries/highlights.scm'), q(JS_FOR_TS, 'queries/highlights-jsx.scm'), 'queries/highlights.scm'],
    injections: [q(JS_FOR_TS, 'queries/injections.scm')],
  },
  {
    pod: 'TreeSitterJavaScript', repo: 'tree-sitter/tree-sitter-javascript', tag: 'v0.25.0', language: 'javascript',
    highlights: ['queries/highlights.scm', 'queries/highlights-jsx.scm', 'queries/highlights-params.scm'],
    injections: ['queries/injections.scm'],
  },
  { pod: 'TreeSitterBash', repo: 'tree-sitter/tree-sitter-bash', tag: 'v0.25.1', language: 'bash', highlights: ['queries/highlights.scm'] },
  { pod: 'TreeSitterJSON', repo: 'tree-sitter/tree-sitter-json', tag: 'v0.24.8', language: 'json', highlights: ['queries/highlights.scm'] },
  {
    pod: 'TreeSitterSwift', repo: 'alex-pinkus/tree-sitter-swift', tag: '0.7.3-with-generated-files', language: 'swift',
    highlights: ['queries/highlights.scm'], injections: ['queries/injections.scm'],
  },
  { pod: 'TreeSitterCSS', repo: 'tree-sitter/tree-sitter-css', tag: 'v0.25.0', language: 'css', highlights: ['queries/highlights.scm'] },
  {
    pod: 'TreeSitterYAML', repo: 'tree-sitter-grammars/tree-sitter-yaml', tag: 'v0.7.2', language: 'yaml',
    highlights: ['queries/highlights.scm'],
    // scanner.c includes it through a macro-built path the include scan cannot follow.
    extraFiles: ['src/schema.core.c'],
  },
  {
    pod: 'TreeSitterHTML', repo: 'tree-sitter/tree-sitter-html', tag: 'v0.23.2', language: 'html',
    highlights: ['queries/highlights.scm'], injections: ['queries/injections.scm'],
  },
  { pod: 'TreeSitterPython', repo: 'tree-sitter/tree-sitter-python', tag: 'v0.25.0', language: 'python', highlights: ['queries/highlights.scm'] },
  { pod: 'TreeSitterDiff', repo: 'the-mikedavis/tree-sitter-diff', tag: 'v0.2.0', language: 'diff', highlights: ['queries/highlights.scm'] },
  {
    pod: 'TreeSitterXML', repo: 'tree-sitter-grammars/tree-sitter-xml', tag: 'v0.7.0', dir: 'xml',
    header: 'bindings/swift/xml', language: 'xml', highlights: ['queries/xml/highlights.scm'],
  },
  { pod: 'TreeSitterTOML', repo: 'tree-sitter-grammars/tree-sitter-toml', tag: 'v0.7.0', language: 'toml', highlights: ['queries/highlights.scm'] },
  { pod: 'TreeSitterDockerfile', repo: 'camdencheek/tree-sitter-dockerfile', tag: 'v0.2.0', language: 'dockerfile', highlights: ['queries/highlights.scm'] },
  {
    pod: 'TreeSitterLua', repo: 'tree-sitter-grammars/tree-sitter-lua', tag: 'v0.5.0', language: 'lua',
    highlights: ['queries/highlights.scm'], injections: ['queries/injections.scm'],
  },
  { pod: 'TreeSitterGo', repo: 'tree-sitter/tree-sitter-go', tag: 'v0.25.0', language: 'go', highlights: ['queries/highlights.scm'] },
  { pod: 'TreeSitterJava', repo: 'tree-sitter/tree-sitter-java', tag: 'v0.23.5', language: 'java', highlights: ['queries/highlights.scm'] },
  { pod: 'TreeSitterC', repo: 'tree-sitter/tree-sitter-c', tag: 'v0.24.2', language: 'c', highlights: ['queries/highlights.scm'] },
  {
    pod: 'TreeSitterMarkdown', repo: 'tree-sitter-grammars/tree-sitter-markdown', tag: 'v0.5.3', dir: 'tree-sitter-markdown',
    header: 'tree-sitter-markdown/bindings/swift', language: 'markdown',
    highlights: ['tree-sitter-markdown/queries/highlights.scm'], injections: ['tree-sitter-markdown/queries/injections.scm'],
  },
  {
    pod: 'TreeSitterMarkdownInline', repo: 'tree-sitter-grammars/tree-sitter-markdown', tag: 'v0.5.3', dir: 'tree-sitter-markdown-inline',
    header: 'tree-sitter-markdown-inline/bindings/swift', language: 'markdown_inline',
    highlights: ['tree-sitter-markdown-inline/queries/highlights.scm'], injections: ['tree-sitter-markdown-inline/queries/injections.scm'],
  },
  {
    pod: 'TreeSitterRust', repo: 'tree-sitter/tree-sitter-rust', tag: 'v0.24.2', language: 'rust',
    highlights: ['queries/highlights.scm'], injections: ['queries/injections.scm'],
  },
  {
    pod: 'TreeSitterPHP', repo: 'tree-sitter/tree-sitter-php', tag: 'v0.25.0', dir: 'php', language: 'php',
    highlights: ['queries/highlights.scm'], injections: ['queries/injections.scm', 'queries/injections-text.scm'],
  },
]

const raw = (repo, tag, file) => `https://raw.githubusercontent.com/${repo}/${tag}/${file}`

async function fetchText(url, { optional = false } = {}) {
  const res = await fetch(url)
  if (res.ok) return res.text()
  if (optional && res.status === 404) return null
  throw new Error(`${res.status} ${url}`)
}

const resolveSource = (grammar, entry) =>
  typeof entry === 'string'
    ? { repo: grammar.repo, tag: grammar.tag, file: entry }
    : entry

async function concatQueries(grammar, entries = []) {
  const parts = []
  for (const entry of entries) {
    const { repo, tag, file } = resolveSource(grammar, entry)
    parts.push(`; ${repo}@${tag} ${file}\n${(await fetchText(raw(repo, tag, file))).trimEnd()}\n`)
  }
  return parts.join('\n')
}

async function localHeaders(grammar, srcDir) {
  const scanner = await fetchText(raw(grammar.repo, grammar.tag, `${srcDir}/scanner.c`), { optional: true })
  if (scanner === null) return { hasScanner: false, external: [] }
  const external = [...(grammar.extraFiles ?? [])]
  const pending = [[`${srcDir}/scanner.c`, scanner]]
  while (pending.length > 0) {
    const [file, text] = pending.pop()
    for (const [, rel] of text.matchAll(/#include\s+"([^"]+)"/g)) {
      if (rel.startsWith('tree_sitter/')) continue
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), rel))
      if (external.includes(target)) continue
      external.push(target)
      pending.push([target, await fetchText(raw(grammar.repo, grammar.tag, target))])
    }
  }
  return { hasScanner: true, external }
}

const rubyList = (items) => items.map((item) => `'${item}'`).join(', ')

function grammarPodspec(grammar, { hasScanner, external }) {
  const srcDir = grammar.dir ? `${grammar.dir}/src` : 'src'
  const header = grammar.header ?? 'bindings/swift'
  const sources = [`${srcDir}/parser.c`, ...(hasScanner ? [`${srcDir}/scanner.c`] : []), `${header}/**/*.h`]
  return `Pod::Spec.new do |s|
  s.name = '${grammar.pod}'
  s.version = '${grammar.tag.replace(/^v/, '').replace(/-.*/, '')}'
  s.summary = 'tree-sitter ${grammar.language} grammar'
  s.homepage = 'https://github.com/${grammar.repo}'
  s.license = { :type => 'MIT' }
  s.author = '${grammar.repo.split('/')[0]}'
  s.source = { :git => 'https://github.com/${grammar.repo}.git', :tag => '${grammar.tag}' }
  s.platforms = { :ios => '15.0' }
  s.static_framework = true
  s.source_files = ${rubyList(sources)}
  s.public_header_files = '${header}/**/*.h'
  s.preserve_paths = ${rubyList([`${srcDir}/tree_sitter/*.h`, ...external])}
  s.compiler_flags = '-w'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'HEADER_SEARCH_PATHS' => '"\${PODS_TARGET_SRCROOT}/${srcDir}"',
  }
end
`
}

const corePodspecs = {
  TreeSitter: `Pod::Spec.new do |s|
  s.name = 'TreeSitter'
  s.version = '${CORE.tag.replace(/^v/, '')}'
  s.summary = 'tree-sitter runtime'
  s.homepage = 'https://github.com/${CORE.repo}'
  s.license = { :type => 'MIT' }
  s.author = 'tree-sitter'
  s.source = { :git => 'https://github.com/${CORE.repo}.git', :tag => '${CORE.tag}' }
  s.platforms = { :ios => '15.0' }
  s.static_framework = true
  s.source_files = 'lib/src/lib.c', 'lib/include/tree_sitter/api.h'
  s.public_header_files = 'lib/include/tree_sitter/api.h'
  s.header_mappings_dir = 'lib/include'
  s.preserve_paths = 'lib/src/**/*.{c,h}'
  s.compiler_flags = '-w'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'HEADER_SEARCH_PATHS' => '"\${PODS_TARGET_SRCROOT}/lib/src" "\${PODS_TARGET_SRCROOT}/lib/include"',
  }
end
`,
  SwiftTreeSitter: `Pod::Spec.new do |s|
  s.name = 'SwiftTreeSitter'
  s.version = '${SWIFT_TREE_SITTER.tag}'
  s.summary = 'Swift API for the tree-sitter runtime'
  s.homepage = 'https://github.com/${SWIFT_TREE_SITTER.repo}'
  s.license = { :type => 'BSD-3-Clause' }
  s.author = 'ChimeHQ'
  s.source = { :git => 'https://github.com/${SWIFT_TREE_SITTER.repo}.git', :tag => '${SWIFT_TREE_SITTER.tag}' }
  s.platforms = { :ios => '15.0' }
  s.swift_version = '5.9'
  s.static_framework = true
  s.source_files = 'Sources/SwiftTreeSitter/**/*.swift'
  s.dependency 'TreeSitter'
end
`,
  SwiftTreeSitterLayer: `Pod::Spec.new do |s|
  s.name = 'SwiftTreeSitterLayer'
  s.version = '${SWIFT_TREE_SITTER.tag}'
  s.summary = 'Nested-language parsing for SwiftTreeSitter'
  s.homepage = 'https://github.com/${SWIFT_TREE_SITTER.repo}'
  s.license = { :type => 'BSD-3-Clause' }
  s.author = 'ChimeHQ'
  s.source = { :git => 'https://github.com/${SWIFT_TREE_SITTER.repo}.git', :tag => '${SWIFT_TREE_SITTER.tag}' }
  s.platforms = { :ios => '15.0' }
  s.swift_version = '5.9'
  s.static_framework = true
  s.source_files = 'Sources/SwiftTreeSitterLayer/**/*.swift'
  s.dependency 'SwiftTreeSitter'
end
`,
}

const grammarSrcDir = (grammar) => (grammar.dir ? `${grammar.dir}/src` : 'src')
const grammarHeader = (grammar) =>
  `${grammar.header ?? 'bindings/swift'}/${grammar.pod}/${grammar.language}.h`

function packageSwift(scanners) {
  const targets = GRAMMARS.map((grammar) => {
    const srcDir = grammarSrcDir(grammar)
    const sources = [`${srcDir}/parser.c`, ...(scanners.get(grammar.pod).hasScanner ? [`${srcDir}/scanner.c`] : [])]
    return `    .target(
      name: "${grammar.pod}",
      path: ".grammars/${grammar.pod}",
      sources: [${sources.map((s) => `"${s}"`).join(', ')}],
      publicHeadersPath: "${path.posix.dirname(path.posix.dirname(grammarHeader(grammar)))}",
      cSettings: [.headerSearchPath("${srcDir}"), .unsafeFlags(["-w"])]
    ),`
  })
  return `// swift-tools-version: 5.9
// Generated by scripts/vendor-tree-sitter.mjs. Test-only: builds Core/ on macOS
// against the grammar sources the app pods pin; run the script with --fetch first.
import PackageDescription

let package = Package(
  name: "YohakuCode",
  platforms: [.macOS(.v13)],
  dependencies: [
    .package(url: "https://github.com/ChimeHQ/SwiftTreeSitter", exact: "${SWIFT_TREE_SITTER.tag}"),
  ],
  targets: [
${targets.join('\n')}
    .target(
      name: "YohakuCodeCore",
      dependencies: [
        .product(name: "SwiftTreeSitter", package: "SwiftTreeSitter"),
        .product(name: "SwiftTreeSitterLayer", package: "SwiftTreeSitter"),
${GRAMMARS.map((g) => `        "${g.pod}",`).join('\n')}
      ],
      path: "Core",
      resources: [.process("Queries")]
    ),
    .testTarget(name: "YohakuCodeCoreTests", dependencies: ["YohakuCodeCore"], path: "Tests"),
  ]
)
`
}

async function fetchGrammarSources(grammar, { hasScanner, external }) {
  const srcDir = grammarSrcDir(grammar)
  const root = path.join(codeDir, '.grammars', grammar.pod)
  const files = [
    `${srcDir}/parser.c`,
    ...(hasScanner ? [`${srcDir}/scanner.c`] : []),
    ...['parser.h', 'alloc.h', 'array.h'].map((h) => `${srcDir}/tree_sitter/${h}`),
    ...external,
    grammarHeader(grammar),
  ]
  for (const file of files) {
    const text = await fetchText(raw(grammar.repo, grammar.tag, file), { optional: file.includes('/tree_sitter/') })
    if (text === null) continue
    await mkdir(path.dirname(path.join(root, file)), { recursive: true })
    await writeFile(path.join(root, file), text)
  }
}

async function main() {
  await rm(podDir, { recursive: true, force: true })
  await mkdir(podDir, { recursive: true })
  await rm(queryDir, { recursive: true, force: true })
  await mkdir(queryDir, { recursive: true })

  for (const [name, spec] of Object.entries(corePodspecs))
    await writeFile(path.join(podDir, `${name}.podspec`), spec)

  const fetchSources = process.argv.includes('--fetch')
  const scanners = new Map()
  for (const grammar of GRAMMARS) {
    const headers = await localHeaders(grammar, grammarSrcDir(grammar))
    scanners.set(grammar.pod, headers)
    if (fetchSources) await fetchGrammarSources(grammar, headers)
    await writeFile(path.join(podDir, `${grammar.pod}.podspec`), grammarPodspec(grammar, headers))
    await writeFile(
      path.join(queryDir, `${grammar.language}-highlights.scm`),
      await concatQueries(grammar, grammar.highlights),
    )
    if (grammar.injections)
      await writeFile(
        path.join(queryDir, `${grammar.language}-injections.scm`),
        await concatQueries(grammar, grammar.injections),
      )
  }

  await writeFile(path.join(codeDir, 'Package.swift'), packageSwift(scanners))
  console.log(`${(await readdir(podDir)).length} podspecs, ${(await readdir(queryDir)).length} query files`)
}

await main()
