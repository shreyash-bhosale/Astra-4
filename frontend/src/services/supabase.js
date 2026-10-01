import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://jrvncrgcmmnrznugoeur.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_nHIzEzYwvcaW8kHGnuSbHQ_9Pbib-JQ';

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project'));
};

let client = null;

if (isSupabaseConfigured()) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'resolveai-supabase-auth'
      }
    });
  } catch (err) {
    console.error('[Supabase Auth] Client initialization failed:', err.message);
  }
}

export const supabase = client;

// Safe configuration diagnostic (never log secret values)
if (typeof window !== 'undefined') {
  console.log('[Supabase Auth] Status: initialized =', Boolean(client), '| URL configured =', Boolean(supabaseUrl), '| Anon key configured =', Boolean(supabaseAnonKey));
}
