import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';

let supabaseInstance = null;

export const isSupabaseConfigured = () => {
  return Boolean(config.supabaseUrl && config.supabaseKey);
};

export const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.supabaseUrl, config.supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
    } catch (err) {
      console.error('[DATABASE] Failed to initialize Supabase client:', err.message);
      return null;
    }
  }

  return supabaseInstance;
};
