import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://iedarnneftukutsswpxt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllZGFybm5lZnR1a3V0c3N3cHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyODAyODMsImV4cCI6MjA5ODg1NjI4M30.I2Wa0hJUEBlcWqmAR5-pZQoFIs5MeJoCFErmuizx7y4';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };
