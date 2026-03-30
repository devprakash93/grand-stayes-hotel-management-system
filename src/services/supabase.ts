import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dikpovhztoaumksqglre.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpa3Bvdmh6dG9hdW1rc3FnbHJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjUzNjQsImV4cCI6MjA4OTI0MTM2NH0.WwMa8SOMPAsJmDcTmIWazYRF69tNkBgb7Uv8nj6lHHU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
