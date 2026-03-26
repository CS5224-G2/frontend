/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const repoRoot = resolve(__dirname, '..')
const sharedRoot = resolve(__dirname, '../shared')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': sharedRoot,
    },
  },
  server: {
    fs: {
      allow: [repoRoot, sharedRoot],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
