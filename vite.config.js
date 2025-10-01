import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";


// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Vite v6 recomienda `host: true` para exponer en LAN
  const host = env.VITE_DEV_HOST || true;
  const port = Number(env.VITE_DEV_PORT || (mode === 'staging' ? 3001 : 3000));

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
      host,
      port,
      strictPort: true,
      cors: true,
      hmr: {
        host: env.VITE_DEV_HMR_HOST || undefined,
        clientPort: env.VITE_DEV_HMR_PORT ? Number(env.VITE_DEV_HMR_PORT) : undefined,
      },
    },
    preview: {
      host: '0.0.0.0',
      port: Number(env.VITE_PREVIEW_PORT || 4173),
    },
  }
})
