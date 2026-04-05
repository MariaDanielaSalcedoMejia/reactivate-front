import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env['VITE_API_URL'] || 'https://reactivate-back.onrender.com'
    ),
  },
});