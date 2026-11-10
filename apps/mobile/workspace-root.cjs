/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')

/**
 * Walk up from `startDir` and collect every directory that contains a
 * `pnpm-workspace.yaml`. A "real" (closed) workspace is one whose packages
 * list includes `@yohaku/web` or that contains `apps/web`. The public
 * `design-oss` / Innei/Yohaku workspace has neither — if that is the only
 * hit, keep walking for a parent closed workspace and use that when present.
 *
 * @param {string} startDir
 * @returns {string}
 */
function findWorkspaceRoot(startDir) {
  const roots = collectWorkspaceRoots(startDir)
  const closed = roots.filter(isClosedWorkspace)
  if (closed.length > 0) return closed[0]
  if (roots.length > 0) return roots[0]
  return path.resolve(startDir, '../..')
}

/**
 * @param {string} startDir
 * @returns {string[]}
 */
function collectWorkspaceRoots(startDir) {
  const roots = []
  let dir = path.resolve(startDir)
  while (true) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
      roots.push(dir)
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return roots
}

/**
 * @param {string} dir
 * @returns {boolean}
 */
function isClosedWorkspace(dir) {
  if (fs.existsSync(path.join(dir, 'apps', 'web'))) return true
  try {
    const yaml = fs.readFileSync(path.join(dir, 'pnpm-workspace.yaml'), 'utf8')
    return /(?:^|[\s"'[\]])@yohaku\/web(?:$|[\s"'\]])/.test(yaml)
  } catch {
    return false
  }
}

/**
 * Optional closed overlay sits beside `apps/mobile` as `mobile-overlay`.
 * Path existence only — never an env-var switch — so a forgotten EAS env
 * cannot ship the public placeholder bundle.
 *
 * @param {string} workspaceRoot
 * @returns {string | null}
 */
function resolveOverlayDir(workspaceRoot) {
  const dir = path.join(workspaceRoot, 'apps', 'mobile-overlay')
  return fs.existsSync(dir) ? dir : null
}

/**
 * @param {string} overlayDir
 * @returns {{ expoJson: string | null, siteTs: string | null }}
 */
function overlayFiles(overlayDir) {
  const expoJson = path.join(overlayDir, 'expo.json')
  const siteTs = path.join(overlayDir, 'site.ts')
  return {
    expoJson: fs.existsSync(expoJson) ? expoJson : null,
    siteTs: fs.existsSync(siteTs) ? siteTs : null,
  }
}

module.exports = {
  collectWorkspaceRoots,
  findWorkspaceRoot,
  isClosedWorkspace,
  overlayFiles,
  resolveOverlayDir,
}
