/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync, readdirSync } from 'fs'
import { join } from 'path'

// Custom plugin to copy public directory excluding card-images
// Card images (4270+ PNG/SVG files) will be stored in a separate S3 bucket
// and fetched at runtime, enabling fast deployments without re-uploading all images
function copyPublicExcludeCardImages(): Plugin {
  return {
    name: 'copy-public-exclude-card-images',
    apply: 'build',
    closeBundle() {
      const publicDir = 'public'
      const outDir = 'dist'
      
      function copyRecursive(src: string, dest: string, exclude: string) {
        const entries = readdirSync(src, { withFileTypes: true })
        
        for (const entry of entries) {
          const srcPath = join(src, entry.name)
          const destPath = join(dest, entry.name)
          
          // Skip the card-images directory
          if (entry.name === 'card-images' && srcPath.includes(exclude)) {
            console.log(`Excluding ${srcPath} from build output`)
            continue
          }
          
          if (entry.isDirectory()) {
            mkdirSync(destPath, { recursive: true })
            copyRecursive(srcPath, destPath, exclude)
          } else {
            copyFileSync(srcPath, destPath)
          }
        }
      }
      
      try {
        copyRecursive(publicDir, outDir, 'card-images')
      } catch (error) {
        console.error('Error copying public directory:', error)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyPublicExcludeCardImages()],
  define: {
    'process.env': {},
  },
  // Disable default public directory copying since we handle it with our custom plugin
  publicDir: false,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['**/*.{test,spec}.{ts,tsx}'],
  },
})
