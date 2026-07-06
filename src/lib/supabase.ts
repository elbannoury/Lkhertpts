import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/supabase';

const supabaseUrl = 'https://srzxzpwispudxldqjjah.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyenh6cHdpc3B1ZHhsZHFqamFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNTM4MDcsImV4cCI6MjA5ODkyOTgwN30.AAa9rSrdcxdgNCkU-Ab9BKqcahbL49KCMIgvl8B3a0s';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to call the owner-auth edge function
export const callOwnerAuth = async (action: string, payload: any) => {
  const { data, error } = await supabase.functions.invoke('owner-auth', {
    body: { action, ...payload },
  });
  if (error) throw error;
  return data;
};
