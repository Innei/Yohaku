declare module './workspace-root.cjs' {
  export function collectWorkspaceRoots(startDir: string): string[]
  export function findWorkspaceRoot(startDir: string): string
  export function isClosedWorkspace(dir: string): boolean
  export function overlayFiles(overlayDir: string): {
    expoJson: string | null
    siteTs: string | null
  }
  export function resolveOverlayDir(workspaceRoot: string): string | null
}
