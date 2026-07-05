import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://vmeljeafghdcbmepstak.supabase.co';
const supabaseKey = 'sb_publishable_d7MktzeV50r6NH4611MHfg_tvcNHGBK';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };
