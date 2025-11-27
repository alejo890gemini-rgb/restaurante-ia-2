
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

// Safe access to environment variables to prevent crashes in non-standard environments
const getEnvVar = (key: string) => {
    try {
        // Use a safe access pattern for import.meta.env
        return (import.meta as any).env?.[key] || '';
    } catch {
        return '';
    }
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Validate keys to prevent crashes if variables are missing
const isValidUrl = supabaseUrl && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'));
const isValidKey = supabaseAnonKey && supabaseAnonKey.length > 0;

let client: SupabaseClient | null = null;

if (isValidUrl && isValidKey) {
    try {
        client = createClient(supabaseUrl, supabaseAnonKey, {
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
        });
    } catch (e) {
        console.warn("⚠️ Error initializing Supabase client:", e);
    }
} else {
    console.warn("⚠️ Supabase credentials missing or invalid. Running in Offline Mode.");
}

export const supabase = client;
