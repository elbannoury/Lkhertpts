import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://oemkmnbyxevfaluyhqdt.supabase.co';
const supabaseKey = 'sb_publishable_KlME07LuKjBV_1ZqkOdLug_94IHWxCk';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };
