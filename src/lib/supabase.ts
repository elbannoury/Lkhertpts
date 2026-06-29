import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://guknrxxiewkygmlkcagk.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjhlYTljYTEyLWFjYjMtNDE3Yi04NjE3LTgwYWExNjY3YjY5YiJ9.eyJwcm9qZWN0SWQiOiJndWtucnh4aWV3a3lnbWxrY2FnayIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzgyNjAzMjA1LCJleHAiOjIwOTc5NjMyMDUsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.4w47hYH4PNZj8ygquA3PghKe854o0OegbexXOE23ka8';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };