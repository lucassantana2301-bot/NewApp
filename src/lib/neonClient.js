import { neon } from '@neondatabase/serverless';

// Retrieve database URL from env or localStorage
export function getNeonDatabaseUrl() {
  const envUrl = import.meta.env.VITE_NEON_DATABASE_URL || '';
  const localUrl = localStorage.getItem('nutrisystem_neon_url') || '';
  
  return localUrl || envUrl;
}

export function saveNeonDatabaseUrl(url) {
  if (url) localStorage.setItem('nutrisystem_neon_url', url.trim());
}

export function clearNeonDatabaseUrl() {
  localStorage.removeItem('nutrisystem_neon_url');
}

// Get neon SQL query helper
export function getSql() {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return null;
  
  try {
    return neon(dbUrl);
  } catch (err) {
    console.error('Erro ao conectar ao Neon:', err);
    return null;
  }
}

// Secure Web Crypto SHA-256 Password Hash
export async function hashPassword(password) {
  const salt = 'NutriSystemNeonSalt2026';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 1. Cadastrar Nutricionista no Neon
export async function registerNutricionista({ nome, email, password }) {
  const sql = getSql();
  if (!sql) {
    throw new Error('Banco de dados Neon não configurado. Verifique a URL de conexão.');
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanNome = nome.trim();

  // Verificar se e-mail já existe
  const existing = await sql`
    SELECT id FROM public.nutricionistas WHERE LOWER(email) = ${cleanEmail} LIMIT 1
  `;

  if (existing && existing.length > 0) {
    throw new Error('Este e-mail já está cadastrado no sistema. Tente fazer login.');
  }

  // Hash da senha
  const senhaHash = await hashPassword(password);

  // Inserir na tabela nutricionistas do Neon
  const result = await sql`
    INSERT INTO public.nutricionistas (nome, email, senha_hash)
    VALUES (${cleanNome}, ${cleanEmail}, ${senhaHash})
    RETURNING id, nome, email, created_at
  `;

  if (!result || result.length === 0) {
    throw new Error('Erro ao criar conta no banco de dados Neon.');
  }

  const user = result[0];
  saveSession(user);
  return user;
}

// 2. Fazer Login no Neon
export async function loginNutricionista({ email, password }) {
  const sql = getSql();
  if (!sql) {
    throw new Error('Banco de dados Neon não configurado. Verifique a URL de conexão.');
  }

  const cleanEmail = email.trim().toLowerCase();

  // Buscar nutricionista por email
  const rows = await sql`
    SELECT id, nome, email, senha_hash, created_at 
    FROM public.nutricionistas 
    WHERE LOWER(email) = ${cleanEmail} 
    LIMIT 1
  `;

  if (!rows || rows.length === 0) {
    throw new Error('E-mail ou senha incorretos. Por favor, verifique seus dados.');
  }

  const user = rows[0];
  const inputHash = await hashPassword(password);

  if (user.senha_hash !== inputHash) {
    throw new Error('E-mail ou senha incorretos. Por favor, verifique seus dados.');
  }

  // Session user object (omit senha_hash)
  const sessionUser = {
    id: user.id,
    nome: user.nome,
    email: user.email,
    created_at: user.created_at
  };

  saveSession(sessionUser);
  return sessionUser;
}

// Session Persistence helpers
const SESSION_KEY = 'nutrisystem_active_session';

export function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getActiveSession() {
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

export function clearActiveSession() {
  localStorage.removeItem(SESSION_KEY);
}
