import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE;
  const useServiceRole = process.env.SUPABASE_USE_SERVICE_ROLE === "true";

  const serverKey = useServiceRole && serviceRoleKey ? serviceRoleKey : supabaseAnonKey;

  if (!supabaseUrl || !serverKey) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local."
    );
  }

  return createClient<Database>(supabaseUrl, serverKey, {
    auth: {
      persistSession: false
    }
  });
}
