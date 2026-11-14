import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tanstackStart(), nitro(), react(), tailwindcss()],
  // react-youtube は CommonJS で、サーバー側の描画では default が { default: コンポーネント } になってしまうので、Vite で変換させる
  ssr: { noExternal: ['react-youtube'] },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
