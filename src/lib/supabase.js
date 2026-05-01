import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL || "https://vyhjjtzdvofoqoericak.supabase.co";
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(url, key);

export function hasSupabaseKey() {
  return Boolean(key);
}
