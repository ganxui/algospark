import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const proxy = { '/api/algospark': { target: 'http://127.0.0.1:3101', changeOrigin: true } };

export default defineConfig({
  root,
  base: '/algospark/',
  publicDir: resolve(root, 'public'),
  server: { host: '127.0.0.1', proxy },
  preview: { host: '127.0.0.1', proxy },
  build: {
    outDir: resolve(root, 'build'),
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
});
