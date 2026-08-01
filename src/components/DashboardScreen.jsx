import React from 'react';
import { LogOut, Users, Calendar, Utensils, ShieldCheck, Plus, Database } from 'lucide-react';
import { clearActiveSession } from '../lib/neonClient';

export default function DashboardScreen({ user, onLogout }) {
  const displayName = user?.nome || user?.email?.split('@')[0] || 'Nutricionista';
  const displayEmail = user?.email || '';

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleLogoutClick = () => {
    clearActiveSession();
    onLogout();
  };

  return (
    <div className="dashboard-container">
      {/* Dashboard Top Navigation */}
      <header className="dashboard-header">
        <div className="dashboard-logo">
          <div className="dashboard-logo-icon">
            <Utensils size={22} />
          </div>
          <div>
            <div className="dashboard-logo-title">
              Nutri<span style={{ color: 'var(--primary)' }}>System</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Painel de Gestão Nutricional</div>
          </div>
        </div>

        <div className="user-badge">
          <div className="user-avatar">{initials}</div>
          <div className="user-details">
            <span className="user-name">Dra. {displayName}</span>
            <span className="user-email">{displayEmail}</span>
          </div>
          <button onClick={handleLogoutClick} className="btn-logout" title="Sair da sua conta">
            <LogOut size={16} />
            Sair do sistema
          </button>
        </div>
      </header>

      {/* Hero Welcome Banner */}
      <section className="hero-card">
        <div className="hero-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Database size={12} /> Autenticado via Neon PostgreSQL
        </div>
        <h1 className="hero-title">Bem-vinda de volta, Dra. {displayName}!</h1>
        <p className="hero-subtitle">
          Seus dados estão sincronizados em tempo real no banco de dados <strong>Neon (nutricionista_sistema)</strong>. Gerencie seus pacientes, crie planos alimentares e acompanhe as consultas.
        </p>
      </section>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div>
            <div className="stat-val">28</div>
            <div className="stat-lbl">Pacientes Ativos</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div>
            <div className="stat-val">4</div>
            <div className="stat-lbl">Consultas Hoje</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Utensils size={24} />
          </div>
          <div>
            <div className="stat-val">42</div>
            <div className="stat-lbl">Dietas Elaboradas</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="stat-val" style={{ color: 'var(--primary)', fontSize: '15px', fontWeight: '700' }}>
              Ativo (Neon DB)
            </div>
            <div className="stat-lbl">Status da Conta</div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Demo Table */}
      <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Próximos Pacientes</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Lista de atendimentos agendados para hoje</p>
          </div>
          <button className="btn-primary" style={{ width: 'auto', padding: '0 20px', height: '42px', fontSize: '13px' }}>
            <Plus size={16} /> Novo Paciente
          </button>
        </div>

        {/* Demo Patients List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { nome: 'Carlos Eduardo Santos', objetivo: 'Emagrecimento & Reeducação Alimentar', horario: '14:30', status: 'Confirmado' },
            { nome: 'Mariana Oliveira Ramos', objetivo: 'Hipertrofia & Nutrição Esportiva', horario: '15:45', status: 'Em andamento' },
            { nome: 'Fernanda Lima Costa', objetivo: 'Acompanhamento Gestacional', horario: '17:00', status: 'Aguardando' },
          ].map((p, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-light)',
                border: '1px solid var(--primary-border)',
              }}
            >
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{p.nome}</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.objetivo}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary-hover)' }}>{p.horario}</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: '#ffffff',
                    color: 'var(--primary)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
