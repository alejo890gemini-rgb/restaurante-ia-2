import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Robust environment variable retrieval for Vite/Netlify
const getEnvVar = (key: string): string => {
  // 1. Modern Vite (Production/Dev)
  // @ts-ignore
  if (import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key] as string;
  }
  // 2. Legacy/Fallback process.env
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    // @ts-ignore
    return process.env[key];
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Validate keys to prevent crashes if variables are missing in Netlify dashboard
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
  console.warn("⚠️ Supabase no inicializado. Verifique las Variables de Entorno en Netlify o .env");
}