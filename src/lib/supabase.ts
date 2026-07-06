import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/supabase';

const supabaseUrl = 'https://fzdxsaxxpabrjzsutwrq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6ZHhzYXh4cGFicmp6c3V0d3JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMTk1ODYsImV4cCI6MjA5ODg5NTU4Nn0.MIgxkrgXE0hb5wALtvX3WJZ07ngRB8fAbFzz-a5uOJs';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to call the owner-auth edge function
export const callOwnerAuth = async (action: string, payload: any) => {
  const { data, error } = await supabase.functions.invoke('owner-auth', {
    body: { action, ...payload },
  });
  if (error) throw error;
  return data;
};
