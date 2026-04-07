import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Target es2015 so esbuild transpiles ?. ?? to Chrome 69-compatible code
    // (react-snap bundles puppeteer@1.8 / Chrome 69 which predates ES2020 syntax)
    target: 'es2015',
  },
})
