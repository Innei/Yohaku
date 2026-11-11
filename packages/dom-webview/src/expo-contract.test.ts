import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseSync } from 'oxc-parser'
import { describe, expect, it } from 'vitest'

const packageDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)
const appDir = path.resolve(packageDir, '../../apps/mobile')

// Resolved from the app rather than from here: the app's `expo` is the one
// whose wrapper actually renders this view, and this package deliberately
// declares no `expo` dependency of its own to install a second copy of.
// expo's `exports` map sends `expo/src/*` to `build/*.js`, so locate the
// package root and read the shipped source directly.
const wrapperPath = path.join(
  path.dirname(
    createRequire(import.meta.url).resolve('expo/package.json', {
      paths: [appDir],
    }),
  ),
  'src/dom/webview-wrapper.tsx',
)

// Passed by expo, satisfied by what `DomWebViewProps` extends — react-native's
// `ViewProps` and React's `RefAttributes` — which reading this one file cannot
// see.
const INHERITED_PROPS = new Set(['onLayout', 'ref', 'style'])

// Minimal ESTree node shape: oxc hands back plain objects, and this file only
// reads `type`, source offsets and a handful of named fields.
interface AstNode {
  type: string
  start: number
  end: number
  [key: string]: unknown
}

interface ParsedSource {
  program: AstNode
  text: string
}

function parse(file: string): ParsedSource {
  const text = readFileSync(file, 'utf8')
  const { program, errors } = parseSync(file, text)
  if (errors.length > 0) {
    throw new Error(`failed to parse ${file}: ${errors[0]?.message}`)
  }
  return { program: program as unknown as AstNode, text }
}

function childNodes(node: AstNode): AstNode[] {
  const children: AstNode[] = []
  for (const [key, value] of Object.entries(node)) {
    if (key === 'type' || key === 'start' || key === 'end') continue
    const values = Array.isArray(value) ? value : [value]
    for (const child of values) {
      if (child && typeof child === 'object' && 'type' in child) {
        children.push(child as AstNode)
      }
    }
  }
  return children
}

function walk(node: AstNode, visit: (node: AstNode) => void) {
  visit(node)
  for (const child of childNodes(node)) walk(child, visit)
}

function propertyName(node: AstNode): string | undefined {
  const key = node.key as AstNode | undefined
  if (!key) return undefined
  if (key.type === 'Identifier') return key.name as string
  if (typeof key.value === 'string') return key.value
  return undefined
}

function findWebViewElementProps(source: ParsedSource) {
  let found: AstNode | undefined
  walk(source.program, (node) => {
    if (node.type !== 'CallExpression') return
    const callee = node.callee as AstNode
    if (callee.type !== 'MemberExpression') return
    if (source.text.slice(callee.start, callee.end) !== 'React.createElement')
      return
    const args = node.arguments as AstNode[]
    if (
      !args[0] ||
      source.text.slice(args[0].start, args[0].end) !== 'webView'
    )
      return
    const props = args[1]
    if (props?.type === 'ObjectExpression') found = props
  })
  return found
}

function readPassedProps(source: ParsedSource) {
  const element = findWebViewElementProps(source)
  if (!element) {
    throw new Error(
      `no React.createElement(webView, {…}) found in ${wrapperPath}`,
    )
  }
  const names = new Set<string>()
  const spreads: string[] = []
  for (const property of element.properties as AstNode[]) {
    if (property.type === 'SpreadElement') {
      const argument = property.argument as AstNode
      spreads.push(source.text.slice(argument.start, argument.end))
      walk(argument, (node) => {
        if (node.type !== 'ObjectExpression') return
        for (const nested of node.properties as AstNode[]) {
          const name = propertyName(nested)
          if (name) names.add(name)
        }
      })
      continue
    }
    const name = propertyName(property)
    if (name) names.add(name)
  }
  return { names, spreads }
}

function readCalledRefMethods(source: ParsedSource) {
  const names = new Set<string>()
  walk(source.program, (node) => {
    if (node.type !== 'CallExpression') return
    const callee = node.callee as AstNode
    if (callee.type !== 'MemberExpression') return
    const receiver = callee.object as AstNode
    if (source.text.slice(receiver.start, receiver.end) !== 'webviewRef.current')
      return
    names.add((callee.property as AstNode).name as string)
  })
  return names
}

function readDeclaredProps(source: ParsedSource) {
  const interfaces = new Map<string, AstNode>()
  // oxc keeps `export` on an ExportNamedDeclaration wrapper, unlike the
  // TypeScript AST where the modifier sits on the declaration itself.
  walk(source.program, (node) => {
    if (node.type === 'TSInterfaceDeclaration') {
      interfaces.set((node.id as AstNode).name as string, node)
    }
  })
  const collect = (name: string, seen: Set<string>): Set<string> => {
    const names = new Set<string>()
    const declaration = interfaces.get(name)
    if (!declaration || seen.has(name)) return names
    seen.add(name)
    for (const clause of (declaration.extends as AstNode[] | undefined) ?? []) {
      const inherited = (clause.expression as AstNode).name as string
      for (const prop of collect(inherited, seen)) names.add(prop)
    }
    for (const member of (declaration.body as AstNode).body as AstNode[]) {
      const name = propertyName(member)
      if (name) names.add(name)
    }
    return names
  }
  return collect('DomWebViewProps', new Set())
}

function readDeclaredRefMethods(source: ParsedSource) {
  const names = new Set<string>()
  walk(source.program, (node) => {
    if (node.type !== 'TSTypeAliasDeclaration') return
    if ((node.id as AstNode).name !== 'DomWebViewRef') return
    const annotation = node.typeAnnotation as AstNode
    if (annotation.type !== 'TSTypeLiteral') return
    for (const member of annotation.members as AstNode[]) {
      const name = propertyName(member)
      if (name) names.add(name)
    }
  })
  return names
}

const wrapper = parse(wrapperPath)
const types = parse(path.join(packageDir, 'src/DomWebView.types.ts'))

const passed = readPassedProps(wrapper)
const called = readCalledRefMethods(wrapper)
const declaredProps = readDeclaredProps(types)
const declaredRefMethods = readDeclaredRefMethods(types)

describe('expo webview-wrapper contract', () => {
  it('reads a wrapper that still renders a webview with props and a ref', () => {
    expect(passed.names.size).toBeGreaterThan(10)
    expect([...called]).toContain('injectJavaScript')
    expect(declaredProps.size).toBeGreaterThan(10)
    expect([...declaredRefMethods]).toContain('injectJavaScript')
  })

  it('declares every prop expo passes down', () => {
    const undeclared = [...passed.names]
      .filter((name) => !declaredProps.has(name) && !INHERITED_PROPS.has(name))
      .sort()
    expect(undeclared).toEqual([])
  })

  it('declares every ref method expo calls', () => {
    const undeclared = [...called]
      .filter((name) => !declaredRefMethods.has(name))
      .sort()
    expect(undeclared).toEqual([])
  })

  it('has one pass-through channel this file cannot enumerate', () => {
    const identifierSpreads = passed.spreads.filter((spread) =>
      /^[$A-Z_a-z][\w$]*$/.test(spread),
    )
    expect(identifierSpreads).toEqual(['dom'])
  })
})
