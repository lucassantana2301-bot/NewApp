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

  if (user.senha_hash && user.senha_hash !== inputHash) {
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

// 3. Buscar Dados do Dashboard em tempo real do Neon
export async function fetchDashboardData(nutricionistaId) {
  const sql = getSql();
  if (!sql || !nutricionistaId) {
    return {
      totalPacientes: 0,
      consultasSemana: 0,
      pacientesSemRetorno: [],
      todasConsultas: [],
      pacientes: []
    };
  }

  try {
    // 1. Total de pacientes da nutricionista logada
    const totalPacientesRes = await sql`
      SELECT COUNT(*)::int as total 
      FROM public.pacientes 
      WHERE nutricionista_id = ${nutricionistaId}
    `;
    const totalPacientes = totalPacientesRes[0]?.total || 0;

    // 2. Consultas da semana atual
    const consultasSemanaRes = await sql`
      SELECT COUNT(c.id)::int as total
      FROM public.consultas c
      JOIN public.pacientes p ON c.paciente_id = p.id
      WHERE p.nutricionista_id = ${nutricionistaId}
        AND c.data_consulta >= date_trunc('week', CURRENT_DATE)
        AND c.data_consulta <= (date_trunc('week', CURRENT_DATE) + INTERVAL '6 days 23:59:59')
    `;
    const consultasSemana = consultasSemanaRes[0]?.total || 0;

    // 3. Pacientes sem retorno: última consulta há mais de 30 dias e sem próximo retorno futuro agendado
    const semRetornoRes = await sql`
      WITH ultimas_consultas AS (
        SELECT 
          paciente_id,
          MAX(data_consulta) as ultima_data,
          MAX(proximo_retorno) as max_proximo_retorno
        FROM public.consultas
        GROUP BY paciente_id
      )
      SELECT 
        p.id,
        p.nome,
        p.telefone,
        p.whatsapp,
        p.email,
        p.objetivo_texto,
        u.ultima_data::text as ultima_consulta,
        u.max_proximo_retorno::text as proximo_retorno,
        (CURRENT_DATE - u.ultima_data)::int as dias_sem_consulta
      FROM public.pacientes p
      JOIN ultimas_consultas u ON p.id = u.paciente_id
      WHERE p.nutricionista_id = ${nutricionistaId}
        AND u.ultima_data < (CURRENT_DATE - INTERVAL '30 days')
        AND (u.max_proximo_retorno IS NULL OR u.max_proximo_retorno < CURRENT_DATE)
      ORDER BY u.ultima_data ASC
    `;

    // 4. Lista de todos os pacientes da nutricionista logada
    const pacientesRes = await sql`
      SELECT 
        p.*,
        (
          SELECT MAX(c.data_consulta)::text 
          FROM public.consultas c 
          WHERE c.paciente_id = p.id
        ) as ultima_consulta_data,
        (
          SELECT MAX(c.proximo_retorno)::text 
          FROM public.consultas c 
          WHERE c.paciente_id = p.id
        ) as proximo_retorno_data,
        (
          SELECT COUNT(*)::int 
          FROM public.consultas c 
          WHERE c.paciente_id = p.id
        ) as total_consultas
      FROM public.pacientes p
      WHERE p.nutricionista_id = ${nutricionistaId}
      ORDER BY p.nome ASC
    `;

    return {
      totalPacientes,
      consultasSemana,
      pacientesSemRetorno: semRetornoRes || [],
      pacientes: pacientesRes || []
    };
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard no Neon:', error);
    throw error;
  }
}

// 4. Buscar detalhes completos de um paciente
export async function fetchPacienteDetalhes(pacienteId, nutricionistaId) {
  const sql = getSql();
  if (!sql) throw new Error('Conexão com o banco Neon indisponível.');

  const pacRes = await sql`
    SELECT * FROM public.pacientes 
    WHERE id = ${pacienteId} AND nutricionista_id = ${nutricionistaId}
    LIMIT 1
  `;

  if (!pacRes || pacRes.length === 0) {
    throw new Error('Paciente não encontrado.');
  }

  const consultasRes = await sql`
    SELECT * FROM public.consultas
    WHERE paciente_id = ${pacienteId}
    ORDER BY data_consulta DESC
  `;

  return {
    paciente: pacRes[0],
    consultas: consultasRes || []
  };
}

// 5. Cadastrar novo Paciente com suporte completo aos dados Pessoais, Clínicos e Hábitos
export async function createPaciente(pacienteData, nutricionistaId) {
  const sql = getSql();
  if (!sql) throw new Error('Conexão com o banco Neon indisponível.');

  const res = await sql`
    INSERT INTO public.pacientes (
      nutricionista_id,
      nome,
      data_nascimento,
      sexo,
      telefone,
      whatsapp,
      email,
      peso_inicial,
      altura,
      objetivos,
      objetivo_texto,
      nivel_atividade,
      patologias,
      restricoes_alimentares,
      alergias,
      medicamentos,
      suplementos,
      refeicoes_por_dia,
      horario_acorda,
      horario_dorme,
      litros_agua,
      atividade_fisica,
      atividade_fisica_descricao,
      observacoes
    ) VALUES (
      ${nutricionistaId},
      ${pacienteData.nome},
      ${pacienteData.data_nascimento || null},
      ${pacienteData.sexo || 'Feminino'},
      ${pacienteData.telefone || null},
      ${pacienteData.whatsapp || null},
      ${pacienteData.email || null},
      ${pacienteData.peso_inicial ? Number(pacienteData.peso_inicial) : null},
      ${pacienteData.altura ? Number(pacienteData.altura) : null},
      ${pacienteData.objetivos && pacienteData.objetivos.length > 0 ? pacienteData.objetivos : null},
      ${pacienteData.objetivo_texto || null},
      ${pacienteData.nivel_atividade || null},
      ${pacienteData.patologias && pacienteData.patologias.length > 0 ? pacienteData.patologias : null},
      ${pacienteData.restricoes_alimentares && pacienteData.restricoes_alimentares.length > 0 ? pacienteData.restricoes_alimentares : null},
      ${pacienteData.alergias && pacienteData.alergias.length > 0 ? pacienteData.alergias : null},
      ${pacienteData.medicamentos || null},
      ${pacienteData.suplementos || null},
      ${pacienteData.refeicoes_por_dia ? parseInt(pacienteData.refeicoes_por_dia, 10) : null},
      ${pacienteData.horario_acorda || null},
      ${pacienteData.horario_dorme || null},
      ${pacienteData.litros_agua ? Number(pacienteData.litros_agua) : null},
      ${typeof pacienteData.atividade_fisica === 'boolean' ? pacienteData.atividade_fisica : false},
      ${pacienteData.atividade_fisica_descricao || null},
      ${pacienteData.observacoes || null}
    )
    RETURNING *
  `;

  return res[0];
}

// 6. Cadastrar Consulta para um Paciente
export async function createConsulta(consultaData) {
  const sql = getSql();
  if (!sql) throw new Error('Conexão com o banco Neon indisponível.');

  const res = await sql`
    INSERT INTO public.consultas (
      paciente_id,
      data_consulta,
      peso,
      cintura,
      quadril,
      percentual_gordura,
      proximo_retorno,
      observacoes
    ) VALUES (
      ${consultaData.paciente_id},
      ${consultaData.data_consulta},
      ${consultaData.peso ? Number(consultaData.peso) : null},
      ${consultaData.cintura ? Number(consultaData.cintura) : null},
      ${consultaData.quadril ? Number(consultaData.quadril) : null},
      ${consultaData.percentual_gordura ? Number(consultaData.percentual_gordura) : null},
      ${consultaData.proximo_retorno || null},
      ${consultaData.observacoes || null}
    )
    RETURNING *
  `;

  return res[0];
}

// 7. Salvar ou atualizar Plano Alimentar do Paciente
export async function savePlanoAlimentar(pacienteId, conteudo) {
  const sql = getSql();
  if (!sql) throw new Error('Conexão com o banco Neon indisponível.');

  const conteudoJson = typeof conteudo === 'string' ? conteudo : JSON.stringify(conteudo);

  // Verificar se já existe plano
  const existing = await sql`
    SELECT id FROM public.planos_alimentares WHERE paciente_id = ${pacienteId} LIMIT 1
  `;

  if (existing && existing.length > 0) {
    const res = await sql`
      UPDATE public.planos_alimentares
      SET conteudo = ${conteudoJson}::jsonb, created_at = NOW()
      WHERE paciente_id = ${pacienteId}
      RETURNING *
    `;
    return res[0];
  } else {
    const res = await sql`
      INSERT INTO public.planos_alimentares (paciente_id, conteudo)
      VALUES (${pacienteId}, ${conteudoJson}::jsonb)
      RETURNING *
    `;
    return res[0];
  }
}

// 8. Buscar Plano Alimentar do Paciente
export async function fetchPlanoAlimentar(pacienteId) {
  const sql = getSql();
  if (!sql) return null;

  try {
    const res = await sql`
      SELECT * FROM public.planos_alimentares
      WHERE paciente_id = ${pacienteId}
      ORDER BY created_at DESC
      LIMIT 1
    `;
    return res && res.length > 0 ? res[0] : null;
  } catch (err) {
    console.error('Erro ao buscar plano alimentar:', err);
    return null;
  }
}

// 9. Excluir Paciente e seus dados relacionados
export async function deletePaciente(pacienteId, nutricionistaId) {
  const sql = getSql();
  if (!sql) throw new Error('Conexão com o banco Neon indisponível.');

  // Excluir consultas e planos antes do paciente
  await sql`DELETE FROM public.consultas WHERE paciente_id = ${pacienteId}`;
  await sql`DELETE FROM public.planos_alimentares WHERE paciente_id = ${pacienteId}`;
  await sql`DELETE FROM public.pacientes WHERE id = ${pacienteId} AND nutricionista_id = ${nutricionistaId}`;

  return true;
}

// 10. Excluir Consulta
export async function deleteConsulta(consultaId) {
  const sql = getSql();
  if (!sql) throw new Error('Conexão com o banco Neon indisponível.');

  await sql`DELETE FROM public.consultas WHERE id = ${consultaId}`;
  return true;
}

// 11. Testar Conexão com o Neon e medir latência
export async function checkNeonConnection() {
  const sql = getSql();
  if (!sql) return { ok: false, latency: 0, message: 'URL não configurada' };

  const start = performance.now();
  try {
    await sql`SELECT 1 as ping`;
    const latency = Math.round(performance.now() - start);
    return { ok: true, latency, message: 'Conectado' };
  } catch (err) {
    return { ok: false, latency: 0, message: err.message };
  }
}

// 7. Popular dados de exemplo no Neon para a nutricionista logada
export async function seedDemoData(nutricionistaId) {
  const sql = getSql();
  if (!sql || !nutricionistaId) return;

  // 1. Paciente com consulta recente e consulta nesta semana
  const p1 = await sql`
    INSERT INTO public.pacientes (
      nutricionista_id, nome, email, telefone, whatsapp, data_nascimento, sexo, peso_inicial, altura, objetivo_texto
    ) VALUES (
      ${nutricionistaId}, 'Mariana Albuquerque', 'mariana@email.com', '(11) 98765-4321', '(11) 98765-4321', '1995-04-12', 'Feminino', 68.5, 1.65, 'Reeducação alimentar e ganho de massa magra'
    ) RETURNING id
  `;

  // Consulta nesta semana
  await sql`
    INSERT INTO public.consultas (
      paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura, proximo_retorno, observacoes
    ) VALUES (
      ${p1[0].id}, CURRENT_DATE, 66.8, 72, 98, 22.4, CURRENT_DATE + INTERVAL '30 days', 'Ótima adesão ao plano nutricional.'
    )
  `;

  // 2. Paciente SEM RETORNO (> 30 dias e sem retorno marcado)
  const p2 = await sql`
    INSERT INTO public.pacientes (
      nutricionista_id, nome, email, telefone, whatsapp, data_nascimento, sexo, peso_inicial, altura, objetivo_texto
    ) VALUES (
      ${nutricionistaId}, 'Carlos Henrique Vieira', 'carlos.h@email.com', '(11) 97123-8899', '(11) 97123-8899', '1988-11-23', 'Masculino', 94.0, 1.78, 'Emagrecimento e controle de triglicerídeos'
    ) RETURNING id
  `;

  // Consulta realizada há 45 dias sem próximo retorno agendado
  await sql`
    INSERT INTO public.consultas (
      paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura, proximo_retorno, observacoes
    ) VALUES (
      ${p2[0].id}, CURRENT_DATE - INTERVAL '45 days', 91.5, 96, 104, 28.1, NULL, 'Primeira consulta de avaliação. Aguardando retorno.'
    )
  `;

  // 3. Mais um paciente sem retorno (> 60 dias)
  const p3 = await sql`
    INSERT INTO public.pacientes (
      nutricionista_id, nome, email, telefone, whatsapp, data_nascimento, sexo, peso_inicial, altura, objetivo_texto
    ) VALUES (
      ${nutricionistaId}, 'Beatriz Souza Martins', 'beatriz.nutri@email.com', '(11) 96543-2100', '(11) 96543-2100', '1992-08-19', 'Feminino', 58.0, 1.60, 'Nutrição funcional e controle de ansiedade alimentar'
    ) RETURNING id
  `;

  await sql`
    INSERT INTO public.consultas (
      paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura, proximo_retorno, observacoes
    ) VALUES (
      ${p3[0].id}, CURRENT_DATE - INTERVAL '62 days', 57.2, 68, 92, 20.1, NULL, 'Necessita reagendamento urgente.'
    )
  `;
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
