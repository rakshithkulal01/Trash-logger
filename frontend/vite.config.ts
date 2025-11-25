import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  // Define environment variable prefix
  envPrefix: 'VITE_',
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code into separate chunk
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Split map libraries into separate chunk
          maps: ['leaflet', 'react-leaflet', 'react-leaflet-cluster'],
          // Split PDF generation into separate chunk
          pdf: ['jspdf', 'html2canvas'],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable minification with esbuild (faster and built-in)
    minify: 'esbuild',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'leaflet', 'react-leaflet'],
  },
});
