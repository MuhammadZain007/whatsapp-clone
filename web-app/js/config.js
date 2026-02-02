// Supabase Configuration
// Replace these with your Supabase project credentials

const SUPABASE_URL = 'https://kwvegxttxwdqkxbdqbos.supabase.co';  // e.g., https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3dmVneHR0eHdkcWt4YmRxYm9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzYwODksImV4cCI6MjA4NTYxMjA4OX0.1Nc4PbcXsIi67RnrFC0-LdAvJZR8PnUCsysTAlMCFoc';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make it globally available
window.supabase = supabaseClient;

// Check if configuration is set
if (SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
    console.warn('⚠️ Supabase is not configured! Please update js/config.js with your credentials.');
} else {
    console.log('✅ Supabase connected successfully!');
}
