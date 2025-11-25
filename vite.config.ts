import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');

  // 1. GOOGLE AI KEY
  // Use the provided key as a strong fallback if the environment variable is not set.
  const API_KEY = env.API_KEY || "";

  // 2. SUPABASE KEYS
  const SUPABASE_URL = env.VITE_SUPABASE_URL || "";
  const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY || "";

  return {
    plugins: [react()],
    base: './', // Important for relative paths in production/Android
    define: {
      // Inject variables into a single process.env object for robust access
      'process.env': {
        API_KEY: API_KEY,
        VITE_SUPABASE_URL: SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: SUPABASE_KEY,
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 2000,
    }
  }
})
