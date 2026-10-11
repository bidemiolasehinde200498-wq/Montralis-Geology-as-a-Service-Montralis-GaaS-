import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Same-origin proxy keeps the session cookie first-party and avoids CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: '0.0.0.0',
    proxy: {
      '/api/v1/auth': 'http://127.0.0.1:8050',
      '/api/v1/gaas': 'http://127.0.0.1:9000',
      '/api/v1/admin': 'http://127.0.0.1:9000',
      '/api/v1/clearinghouse': 'http://127.0.0.1:8000',
      '/api/v1/portal': 'http://127.0.0.1:9000'
    }
  }
});
