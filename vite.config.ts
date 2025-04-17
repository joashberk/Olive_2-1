import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  json: {
    stringify: true
  },
  publicDir: 'public',
  server: {
    host: true,
    port: 5173,
    hmr: {
      timeout: 5000
    },
    fs: {
      strict: false,
      allow: ['..']
    }
  },
  optimizeDeps: {
    force: true,
    include: ['react-router-dom'],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-slider', '@radix-ui/react-toast'],
          'editor-vendor': ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-color', '@tiptap/extension-highlight', '@tiptap/extension-link', '@tiptap/extension-text-align', '@tiptap/extension-text-style', '@tiptap/extension-underline']
        }
      }
    }
  }
})