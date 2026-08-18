import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const packageDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)
const appDir = path.resolve(packageDir, '../../apps/mobile')

// Resolved from the app rather than from here: the app's `expo` is the one
// whose wrapper actually renders this view, and this package deliberately
// declares no `expo` dependency of its own to install a second copy of.
const wrapperPath = createRequire(import.meta.url).resolve(
  'expo/src/dom/webview-wrapper.tsx',
  { paths: [appDir] },
)

// Passed by expo, satisfied by what `DomWebViewProps` extends — react-native's
// `ViewProps` and React's `RefAttributes` — which reading this one file cannot
// see.
const INHERITED_PROPS = new Set(['onLayout', 'ref', 'style'])

function parse(file: string) {
  return ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
}

function memberName(member: ts.Node): string | undefined {
  const name = (member as { name?: ts.Node }).name
  if (!name) return undefined
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text
  return undefined
}

function walk(node: ts.Node, visit: (node: ts.Node) => void) {
  visit(node)
  ts.forEachChild(node, (child) => walk(child, visit))
}

function findWebViewElementProps(source: ts.SourceFile) {
  let found: ts.ObjectLiteralExpression | undefined
  walk(source, (node) => {
    if (!ts.isCallExpression(node)) return
    if (node.expression.getText(source) !== 'React.createElement') return
    if (node.arguments[0]?.getText(source) !== 'webView') return
    const props = node.arguments[1]
    if (props && ts.isObjectLiteralExpression(props)) found = props
  })
  return found
}

function readPassedProps(source: ts.SourceFile) {
  const element = findWebViewElementProps(source)
  if (!element) {
    throw new Error(
      `no React.createElement(webView, {…}) found in ${wrapperPath}`,
    )
  }
  const names = new Set<string>()
  const spreads: string[] = []
  for (const property of element.properties) {
    if (ts.isSpreadAssignment(property)) {
      spreads.push(property.expression.getText(source))
      walk(property.expression, (node) => {
        if (!ts.isObjectLiteralExpression(node)) return
        for (const nested of node.properties) {
          const name = memberName(nested)
          if (name) names.add(name)
        }
      })
      continue
    }
    const name = memberName(property)
    if (name) names.add(name)
  }
  return { names, spreads }
}

function readCalledRefMethods(source: ts.SourceFile) {
  const names = new Set<string>()
  walk(source, (node) => {
    if (!ts.isCallExpression(node)) return
    const callee = node.expression
    if (!ts.isPropertyAccessExpression(callee)) return
    if (callee.expression.getText(source) !== 'webviewRef.current') return
    names.add(callee.name.text)
  })
  return names
}

function readDeclaredProps(source: ts.SourceFile) {
  const interfaces = new Map<string, ts.InterfaceDeclaration>()
  source.forEachChild((node) => {
    if (ts.isInterfaceDeclaration(node)) interfaces.set(node.name.text, node)
  })
  const collect = (name: string, seen: Set<string>): Set<string> => {
    const names = new Set<string>()
    const declaration = interfaces.get(name)
    if (!declaration || seen.has(name)) return names
    seen.add(name)
    for (const clause of declaration.heritageClauses ?? []) {
      for (const type of clause.types) {
        for (const inherited of collect(
          type.expression.getText(source),
          seen,
        )) {
          names.add(inherited)
        }
      }
    }
    for (const member of declaration.members) {
      const memberIdentifier = memberName(member)
      if (memberIdentifier) names.add(memberIdentifier)
    }
    return names
  }
  return collect('DomWebViewProps', new Set())
}

function readDeclaredRefMethods(source: ts.SourceFile) {
  const names = new Set<string>()
  source.forEachChild((node) => {
    if (!ts.isTypeAliasDeclaration(node)) return
    if (node.name.text !== 'DomWebViewRef') return
    if (!ts.isTypeLiteralNode(node.type)) return
    for (const member of node.type.members) {
      const memberIdentifier = memberName(member)
      if (memberIdentifier) names.add(memberIdentifier)
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
