import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const inDocker = !!process.env.API_PROXY_TARGET;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': process.env.API_PROXY_TARGET ?? 'http://localhost:5080' },
    watch: { usePolling: inDocker },
  },
  // npm run test:coverage (and CI) fails if coverage drops below these
  test: { coverage: { thresholds: { lines: 90, branches: 90, functions: 90, statements: 90 } } },
});
