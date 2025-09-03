import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";


// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      __APP_ENV__: JSON.stringify(mode),
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'staging',
    },
    server: {
      host: mode === 'staging' ? '0.0.0.0' : 'localhost',
      port: mode === 'staging' ? 3001 : 3000,
    },
  }
})
