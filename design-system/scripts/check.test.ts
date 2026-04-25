import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  extractCheatsheetHex,
  extractTokens,
  lintTemplate,
  runChecks,
} from './check.ts'

test('extractTokens parses --color-neutral-N from tokens.css', () => {
  const css = `
    @theme {
      --color-neutral-1: #f8f8f8;
      --color-neutral-9: #242424;
      --color-accent: #c56473;
    }
  `
  const tokens = extractTokens(css)
  assert.equal(tokens.get('--color-neutral-1'), '#f8f8f8')
  assert.equal(tokens.get('--color-neutral-9'), '#242424')
  assert.equal(tokens.get('--color-accent'), '#c56473')
})

test('extractCheatsheetHex parses hex values from a table cell', () => {
  const md = `
    | Var | Hex | Use |
    |---|---|---|
    | \`--color-neutral-1\` | \`#f8f8f8\` | Page bg |
    | \`--color-accent\` | \`#c56473\` | CTA |
  `
  const hexes = extractCheatsheetHex(md)
  assert.equal(hexes.get('--color-neutral-1'), '#f8f8f8')
  assert.equal(hexes.get('--color-accent'), '#c56473')
})

test('lintTemplate flags banned text-neutral-50 class', () => {
  const html = `<p class="text-neutral-500">Body</p>`
  const issues = lintTemplate(html, 'snippet.html')
  assert.equal(issues.length, 1)
  assert.match(issues[0], /text-neutral-500/)
})

test('lintTemplate flags raw hex inside inline style attribute', () => {
  const html = `<div style="color: #ff0000">!</div>`
  const issues = lintTemplate(html, 'snippet.html')
  assert.ok(issues.some((i) => i.includes('#ff0000')))
})

test('lintTemplate accepts var(--color-...) references', () => {
  const html = `<div style="color: var(--color-neutral-9)">ok</div>`
  const issues = lintTemplate(html, 'snippet.html')
  assert.equal(issues.length, 0)
})

test('lintTemplate accepts white/black sentinels in inline style', () => {
  const html = `<button style="background: var(--color-accent); color: #ffffff;">ok</button>`
  const issues = lintTemplate(html, 'snippet.html')
  assert.equal(issues.length, 0)
})

test('lintTemplate ignores hex inside <style> blocks (token declarations are allowed)', () => {
  const html = `<style>:root { --color-neutral-1: #f8f8f8; }</style><p>ok</p>`
  const issues = lintTemplate(html, 'scaffold.html')
  assert.equal(issues.length, 0)
})

test('runChecks returns ok on a consistent token + cheatsheet', () => {
  const result = runChecks({
    tokensCss: `@theme { --color-neutral-9: #242424; }`,
    cheatsheetMd: `| \`--color-neutral-9\` | \`#242424\` | Body |`,
    templates: [],
  })
  assert.equal(result.ok, true)
  assert.equal(result.issues.length, 0)
})

test('runChecks reports drift when cheatsheet hex disagrees with tokens', () => {
  const result = runChecks({
    tokensCss: `@theme { --color-neutral-9: #242424; }`,
    cheatsheetMd: `| \`--color-neutral-9\` | \`#000000\` | Body |`,
    templates: [],
  })
  assert.equal(result.ok, false)
  assert.ok(result.issues[0].includes('--color-neutral-9'))
})
