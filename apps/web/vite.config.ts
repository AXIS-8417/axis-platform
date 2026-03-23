import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@axis/engine': path.resolve(__dirname, '../../packages/engine/src/index.ts'),
    },
  },
});
