import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://vmeljeafghdcbmepstak.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtZWxqZWFmZ2hkY2JtZXBzdGFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNDM1MjMsImV4cCI6MjA5ODgxOTUyM30.icj41Dwm5DcAfjrV7s2Fdqmfd3UyW5Bvw-o2dcoubMk';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };
