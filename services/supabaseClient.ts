import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Declare process for TypeScript
declare const process: any;

// Use the same robust environment variable retrieval as other services
const supabaseUrl = (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_URL) ? process.env.VITE_SUPABASE_URL : '';
const supabaseAnonKey = (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_ANON_KEY) ? process.env.VITE_SUPABASE_ANON_KEY : '';


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
  console.warn("⚠️ Supabase no inicializado. Verifique las Variables de Entorno en Netlify o en su archivo .env (ej. VITE_SUPABASE_URL=...)");
}