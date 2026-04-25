import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const showcaseRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: showcaseRoot,
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  build: { outDir: 'dist', emptyOutDir: true },
})
