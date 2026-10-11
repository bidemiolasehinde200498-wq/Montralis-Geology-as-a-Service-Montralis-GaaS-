import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	server: {
		port: 3002,
		host: '0.0.0.0',
		proxy: {
			'/api/v1/auth': 'http://127.0.0.1:8050',
			'/api/v1': 'http://127.0.0.1:9000'
		}
	}
});
