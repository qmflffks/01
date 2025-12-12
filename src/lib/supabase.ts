import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ibxpcbgelrwruchdeixs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlieHBjYmdlbHJ3cnVjaGRlaXhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTE2ODcsImV4cCI6MjA4MTEyNzY4N30.Sq6tpsLoVRdfYVz2VBKOZb5Xk0fmEN7chT2ELeGAiGU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
