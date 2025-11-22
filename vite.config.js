import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React dependencies
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // Heavy markdown/code editor dependencies
          'markdown': [
            'react-markdown',
            'remark-math',
            'remark-gfm',
            'remark-breaks',
            'rehype-katex'
          ],

          // Syntax highlighting (large library)
          'syntax-highlighter': ['react-syntax-highlighter'],

          // UI animation libraries
          'animations': ['framer-motion'],

          // Supabase client
          'supabase': ['@supabase/supabase-js'],
        }
      }
    },
    // Increase chunk size warning limit for better splitting
    chunkSizeWarningLimit: 1000,
  }
})
