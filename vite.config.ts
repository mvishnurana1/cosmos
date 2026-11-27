import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks(moduleId) {
          if (moduleId.includes('/three/build/three.core.js')) return 'three-core'
          if (moduleId.includes('/node_modules/three/')) return 'three-renderer'
        },
      },
    },
  },
})
