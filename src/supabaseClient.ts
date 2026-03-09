
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Standard client for regular user interactions (Respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for user management (Bypasses RLS)
// WARNING: This should technically be used only in a secure server environment (Edge Functions).
// We are using it here for the MVP/Demo purposes to allow the 'Add User' form to work from the client.
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;
