import { supabase } from './supabaseClient';

export async function deleteAccount(): Promise<{ error: Error | null }> {
  const { error } = await supabase.functions.invoke('delete-account');
  return { error: error ?? null };
}
