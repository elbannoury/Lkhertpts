import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://vmeljeafghdcbmepstak.supabase.co';
const supabaseKey = 'sb_secret_zqc3Rfz0fxoA0GpAVYuoxA_DmHbxS4L';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };
