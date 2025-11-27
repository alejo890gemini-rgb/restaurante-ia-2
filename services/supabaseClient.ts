// FIX: Manually define ImportMeta for Vite env variables to resolve TypeScript errors.
// By wrapping this in `declare global`, we are augmenting the global ImportMeta interface
// rather than declaring a new local one. This makes it available project-wide.
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_API_KEY?: string;
      readonly VITE_SUPABASE_URL?: string;
      readonly VITE_SUPABASE_ANON_KEY?: string;
    };
  }
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use import.meta.env for Vite environment variables with safety check
const env = import.meta.env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

// Validate keys to prevent crashes if variables are missing
const isValidUrl = supabaseUrl && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'));
const isValidKey = supabaseAnonKey && supabaseAnonKey.length > 0;

export const supabase: SupabaseClient | null = (isValidUrl && isValidKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true, // Keep users logged in across reloads
        autoRefreshToken: true,
      },
      // Improve reliability for multi-user realtime connections
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }) 
  : null;

if (!supabase) {
  console.warn("⚠️ Supabase no inicializado. Verifique las Variables de Entorno en Netlify (deben empezar con VITE_...)");
}