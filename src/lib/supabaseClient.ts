import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ushfqdljyfucrhhpkxyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzaGZxZGxqeWZ1Y3JoaHBreHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMjg5MTQsImV4cCI6MjA3MzkwNDkxNH0.WPK4iXSEG4TofbpRfhaeB7hWzaws52zQb_cHVJxvJls';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);