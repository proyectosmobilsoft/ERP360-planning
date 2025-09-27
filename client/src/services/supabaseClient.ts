import { createClient } from '@supabase/supabase-js';

// Valores por defecto para Supabase
const supabaseUrl = 'https://vxloknngtzzrbsovhckj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4bG9rbm5ndHp6cmJzb3ZoY2tqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MjE3NTksImV4cCI6MjA2OTM5Nzc1OX0.dirzx1V9aXrx0xsauZrML2dLDAzhMUIpmzZHGDMRYYo';

// Solo usar variables de entorno si están disponibles (en el navegador)
let finalSupabaseUrl = supabaseUrl;
let finalSupabaseAnonKey = supabaseAnonKey;

if (typeof window !== 'undefined' && import.meta.env) {
  finalSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || supabaseUrl;
  finalSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || supabaseAnonKey;
}

export const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey); 