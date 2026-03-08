import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  base: '/macfor-homepage-sem-foto/',
  server: {
    port: 3001,
    host: true,
    open: false,
  },
  build: {
    outDir: 'dist',
  },
})
