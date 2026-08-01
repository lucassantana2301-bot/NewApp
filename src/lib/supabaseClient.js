import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from env or localStorage fallback
export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = localStorage.getItem('nutrisystem_supabase_url') || '';
  const localKey = localStorage.getItem('nutrisystem_supabase_key') || '';

  // Use localStorage if set, otherwise env if valid non-placeholder, otherwise local
  const isEnvPlaceholder = !envUrl || envUrl.includes('xyzcompany') || envUrl.includes('your-project');
  
  const url = localUrl || (!isEnvPlaceholder ? envUrl : '');
  const key = localKey || (!isEnvPlaceholder ? envKey : '');

  return { url, key, isConfigured: Boolean(url && key) };
}

let supabaseInstance = null;
let currentUrl = null;
let currentKey = null;

export function getSupabase() {
  const { url, key } = getSupabaseCredentials();

  if (!url || !key) {
    return null;
  }

  // Re-create instance if credentials changed
  if (!supabaseInstance || currentUrl !== url || currentKey !== key) {
    currentUrl = url;
    currentKey = key;
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseInstance;
}

export function saveSupabaseCredentials(url, key) {
  if (url) localStorage.setItem('nutrisystem_supabase_url', url.trim());
  if (key) localStorage.setItem('nutrisystem_supabase_key', key.trim());
  supabaseInstance = null; // Force reset
}

export function clearSupabaseCredentials() {
  localStorage.removeItem('nutrisystem_supabase_url');
  localStorage.removeItem('nutrisystem_supabase_key');
  supabaseInstance = null;
}

// Friendly error message parser for Supabase Auth errors
export function parseAuthError(error) {
  if (!error) return '';
  const message = error.message || String(error);

  if (message.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos. Por favor, verifique seus dados.';
  }
  if (message.includes('User already registered') || message.includes('already exists')) {
    return 'Este e-mail já está cadastrado no sistema. Tente fazer login.';
  }
  if (message.includes('Password should be at least 6 characters')) {
    return 'A senha deve ter no mínimo 6 caracteres.';
  }
  if (message.includes('Unable to validate email address') || message.includes('invalid format')) {
    return 'Por favor, informe um endereço de e-mail válido.';
  }
  if (message.includes('Email not confirmed')) {
    return 'E-mail ainda não confirmado. Por favor, verifique sua caixa de entrada.';
  }
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Erro de conexão com o servidor Supabase. Verifique sua conexão com a internet ou a URL configurada.';
  }

  return message;
}
