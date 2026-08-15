import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  LayoutDashboard, 
  UserCheck, 
  LogOut, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Database, 
  RefreshCw, 
  Sparkles, 
  CalendarCheck, 
  CheckCircle2, 
  Activity,
  CalendarDays,
  MessageCircle,
  Zap,
  Filter
} from 'lucide-react';
import { 
  fetchDashboardData, 
  clearActiveSession, 
  seedDemoData,
  checkNeonConnection 
} from '../lib/neonClient';
import PatientFormScreen from './PatientFormScreen';
import PatientProfileScreen from './PatientProfileScreen';

export default function DashboardScreen({ user, onLogout }) {
  // Views: 'dashboard' | 'pacientes' | 'novo-paciente' | 'perfil-paciente'
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientFilter, setPatientFilter] = useState('todos'); // 'todos' | 'sem_retorno'
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dbStatus, setDbStatus] = useState({ ok: true, latency: 28 });
  const [dashboardData, setDashboardData] = useState({
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: [],
    pacientes: []
  });

  const [patientSearch, setPatientSearch] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);

  const displayName = user?.nome || 'Nutricionista';
  const displayEmail = user?.email || '';

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Exibir Toast temporário
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Carregar dados em tempo real do Neon
  const loadData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);

    try {
      if (user?.id) {
        const data = await fetchDashboardData(user.id);
        setDashboardData(data);
      }
      const ping = await checkNeonConnection();
      setDbStatus(ping);
    } catch (err) {
      console.error('Erro ao carregar dados do Neon:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Logout
  const handleLogoutClick = () => {
    clearActiveSession();
    onLogout();
  };

  // Abrir Perfil do Paciente
  const handleOpenPatientProfile = (patientId) => {
    setSelectedPatientId(patientId);
    setCurrentView('perfil-paciente');
  };

  // Callback de sucesso ao cadastrar paciente
  const handlePatientSaved = (newPatient) => {
    showToast('Paciente cadastrado com sucesso!');
    loadData(false);
    if (newPatient?.id) {
      setSelectedPatientId(newPatient.id);
      setCurrentView('perfil-paciente');
    } else {
      setCurrentView('pacientes');
    }
  };

  // Callback de paciente excluído
  const handlePatientDeleted = () => {
    showToast('Paciente excluído com sucesso.');
    setSelectedPatientId(null);
    setCurrentView('pacientes');
    loadData(false);
  };

  // Gerar dados de teste caso a tabela esteja vazia
  const handleSeedDemoData = async () => {
    setDemoLoading(true);
    try {
      await seedDemoData(user.id);
      showToast('Dados de teste inseridos com sucesso no Neon!');
      await loadData(false);
    } catch (err) {
      alert('Erro ao gerar dados de teste: ' + err.message);
    } finally {
      setDemoLoading(false);
    }
  };

  // Abrir WhatsApp rápido
  const handleQuickWhatsApp = (e, paciente) => {
    e.stopPropagation();
    const raw = paciente.whatsapp || paciente.telefone || '';
    const clean = raw.replace(/\D/g, '');
    if (!clean) {
      alert('Paciente sem WhatsApp cadastrado.');
      return;
    }
    const nome = paciente.nome.split(' ')[0];
    const msg = `Olá ${nome}! Aqui é do consultório de nutrição do(a) ${displayName}. Gostaria de agendar o seu retorno nutricional?`;
    window.open(`https://wa.me/55${clean}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Filtragem dos pacientes
  const filteredPacientes = dashboardData.pacientes.filter((p) => {
    const matchesSearch = p.nome?.toLowerCase().includes(patientSearch.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(patientSearch.toLowerCase())) ||
      (p.telefone && p.telefone.includes(patientSearch)) ||
      (p.objetivo_texto && p.objetivo_texto.toLowerCase().includes(patientSearch.toLowerCase()));

    if (!matchesSearch) return false;

    if (patientFilter === 'sem_retorno') {
      return dashboardData.pacientesSemRetorno.some(sr => sr.id === p.id);
    }

    return true;
  });

  return (
    <div className="dashboard-app-layout">
      {/* Toast de Sucesso */}
      {toastMessage && (
        <div className="toast-success">
          <CheckCircle2 size={20} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Menu Lateral Fixo com Logo "Nutri lucas" */}
      <aside className="sidebar-fixed">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Activity size={22} strokeWidth={2.8} />
          </div>
          <div className="sidebar-brand-text">
            Nutri <span>lucas</span>
          </div>
        </div>

        {/* Navegação */}
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('dashboard');
              setSelectedPatientId(null);
            }}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-item ${currentView === 'pacientes' || currentView === 'novo-paciente' || currentView === 'perfil-paciente' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('pacientes');
              setSelectedPatientId(null);
            }}
          >
            <Users size={18} />
            <span>Pacientes ({dashboardData.totalPacientes})</span>
          </button>
        </nav>

        {/* Status Neon Serverless */}
        <div style={{ padding: '0 14px', marginBottom: '8px' }}>
          <div style={{ background: '#18181b', border: '1px solid #27272a', padding: '8px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a1a1aa' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dbStatus.ok ? '#22c55e' : '#ef4444', boxShadow: dbStatus.ok ? '0 0 8px #22c55e' : 'none' }}></span>
              Neon PostgreSQL
            </span>
            <span style={{ color: '#ffffff', fontWeight: '800' }}>{dbStatus.latency}ms</span>
          </div>
        </div>

        {/* Rodapé da Sidebar com Usuário e Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{displayName}</div>
              <div className="sidebar-user-email">{displayEmail}</div>
            </div>
          </div>

          <button
            onClick={handleLogoutClick}
            className="btn-logout"
            style={{ width: '100%', justifyContent: 'center' }}
            title="Sair do sistema"
          >
            <LogOut size={15} />
            <span>Sair do sistema</span>
          </button>
        </div>
      </aside>

      {/* Área Principal de Conteúdo */}
      <main className="main-content-area">
        {/* ========================================================================= */}
        {/* VIEW 1: DASHBOARD PRINCIPAL (Prompt 3) */}
        {/* ========================================================================= */}
        {currentView === 'dashboard' && (
          <div>
            {/* Top Bar */}
            <div className="dashboard-top-bar">
              <div className="dashboard-heading">
                <h1>Dashboard Principal</h1>
                <p>Olá, {displayName}. Acompanhe os indicadores em tempo real sincronizados com o Neon.</p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  className="btn-icon-secondary"
                  onClick={() => loadData(false)}
                  disabled={refreshing || loading}
                  title="Atualizar dados do Neon"
                >
                  <RefreshCw size={14} className={refreshing ? 'spinner' : ''} />
                  {refreshing ? 'Atualizando...' : 'Atualizar'}
                </button>

                <button
                  className="btn-primary"
                  style={{ width: 'auto', padding: '0 18px', height: '40px', fontSize: '13px' }}
                  onClick={() => setCurrentView('novo-paciente')}
                >
                  <Plus size={16} />
                  <span>Novo Paciente</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 16px auto' }}></div>
                <p style={{ fontWeight: '700', color: 'var(--text-main)' }}>Carregando dados em tempo real do Neon...</p>
              </div>
            ) : (
              <>
                {/* Grid dos Cards 1 e 2 */}
                <div className="dashboard-cards-grid">
                  {/* Card 1 — Total de pacientes ativos */}
                  <div className="dash-card-stat">
                    <div className="dash-stat-icon green">
                      <Users size={28} />
                    </div>
                    <div>
                      <div className="dash-stat-title">Total de pacientes ativos</div>
                      <div className="dash-stat-number">{dashboardData.totalPacientes}</div>
                      <div className="dash-stat-desc">
                        <CheckCircle2 size={13} /> Pacientes cadastrados no seu perfil
                      </div>
                    </div>
                  </div>

                  {/* Card 2 — Consultas da semana */}
                  <div className="dash-card-stat">
                    <div className="dash-stat-icon emerald">
                      <Calendar size={28} />
                    </div>
                    <div>
                      <div className="dash-stat-title">Consultas da semana</div>
                      <div className="dash-stat-number">{dashboardData.consultasSemana}</div>
                      <div className="dash-stat-desc">
                        <CalendarCheck size={13} /> Agendadas/Realizadas nesta semana
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 3 — Pacientes sem retorno */}
                <div className="dash-card-full">
                  <div className="card-header-flex">
                    <div className="card-title-group">
                      <div className="card-badge-icon">
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <div className="card-title-main">Pacientes sem retorno</div>
                        <div className="card-subtitle-main">
                          Última consulta há mais de 30 dias sem próximo retorno agendado
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '800',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        background: dashboardData.pacientesSemRetorno.length > 0 ? '#fee2e2' : '#f0fdf4',
                        color: dashboardData.pacientesSemRetorno.length > 0 ? '#991b1b' : '#166534',
                      }}
                    >
                      {dashboardData.pacientesSemRetorno.length} {dashboardData.pacientesSemRetorno.length === 1 ? 'paciente' : 'pacientes'}
                    </span>
                  </div>

                  {/* Lista com os pacientes sem retorno ou mensagem vazia */}
                  {dashboardData.pacientesSemRetorno.length === 0 ? (
                    <div className="empty-state-box">
                      <div className="empty-state-icon">
                        <CheckCircle2 size={26} />
                      </div>
                      <div className="empty-state-text">
                        Nenhum paciente sem retorno no momento
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Todos os seus pacientes estão com consultas em dia ou retornos futuros agendados.
                      </p>
                    </div>
                  ) : (
                    <div className="sem-retorno-list">
                      {dashboardData.pacientesSemRetorno.map((paciente) => (
                        <div
                          key={paciente.id}
                          className="sem-retorno-item"
                          onClick={() => handleOpenPatientProfile(paciente.id)}
                          title="Clique para ver o perfil completo do paciente"
                        >
                          <div>
                            <div className="sem-retorno-name">
                              {paciente.nome}
                              <ChevronRight size={15} style={{ opacity: 0.6 }} />
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                              {paciente.telefone && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Phone size={12} /> {paciente.telefone}
                                </span>
                              )}
                              {paciente.email && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Mail size={12} /> {paciente.email}
                                </span>
                              )}
                              {paciente.objetivo_texto && (
                                <span>• {paciente.objetivo_texto}</span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="sem-retorno-badge-alert">
                              <Clock size={13} />
                              <span>Sem retorno há {paciente.dias_sem_consulta || '30+'} dias</span>
                            </div>

                            <button
                              className="btn-icon-secondary"
                              style={{ color: '#16a34a', borderColor: '#bbf7d0', padding: '6px 10px' }}
                              onClick={(e) => handleQuickWhatsApp(e, paciente)}
                              title="Chamar no WhatsApp"
                            >
                              <MessageCircle size={14} />
                            </button>

                            <button
                              className="btn-icon-secondary"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPatientProfile(paciente.id);
                              }}
                            >
                              Ver Perfil
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Banner de Demonstração / Ajuda se a base estiver vazia */}
                {dashboardData.totalPacientes === 0 && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                      border: '1px solid var(--primary-border)',
                      borderRadius: 'var(--radius-xl)',
                      padding: '24px 28px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                      animation: 'fadeInUp 0.3s ease',
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '900', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={18} /> Banco de dados pronto no Neon!
                      </h4>
                      <p style={{ fontSize: '13px', color: '#7f1d1d', marginTop: '4px' }}>
                        Você pode cadastrar seus pacientes ou gerar 3 pacientes de exemplo para testar os 3 cards do Dashboard.
                      </p>
                    </div>
                    <button
                      className="btn-primary"
                      style={{ width: 'auto', height: '42px', padding: '0 20px', fontSize: '13px' }}
                      onClick={handleSeedDemoData}
                      disabled={demoLoading}
                    >
                      <Sparkles size={15} />
                      {demoLoading ? 'Inserindo no Neon...' : 'Gerar Dados de Teste'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: LISTAGEM DE PACIENTES (Prompt 4) */}
        {/* ========================================================================= */}
        {currentView === 'pacientes' && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            <div className="dashboard-top-bar">
              <div className="dashboard-heading">
                <h1>Pacientes</h1>
                <p>Todos os pacientes cadastrados pela nutricionista logada no Neon.</p>
              </div>

              <button
                className="btn-primary"
                style={{ width: 'auto', padding: '0 20px', height: '42px', fontSize: '13px' }}
                onClick={() => setCurrentView('novo-paciente')}
              >
                <Plus size={16} />
                <span>Novo Paciente</span>
              </button>
            </div>

            {/* Barra de Busca e Filtros Rápidos */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Buscar paciente por nome, email ou telefone..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '42px', height: '44px' }}
                />
              </div>

              {/* Filtros */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`chip-select-btn ${patientFilter === 'todos' ? 'selected' : ''}`}
                  onClick={() => setPatientFilter('todos')}
                >
                  Todos ({dashboardData.totalPacientes})
                </button>
                <button
                  className={`chip-select-btn ${patientFilter === 'sem_retorno' ? 'selected' : ''}`}
                  onClick={() => setPatientFilter('sem_retorno')}
                >
                  <AlertTriangle size={13} /> Sem Retorno ({dashboardData.pacientesSemRetorno.length})
                </button>
              </div>
            </div>

            {/* Listagem de Pacientes ou Mensagem Vazia */}
            {dashboardData.pacientes.length === 0 ? (
              <div className="empty-state-box" style={{ padding: '60px 20px' }}>
                <div className="empty-state-icon">
                  <Users size={30} />
                </div>
                <div className="empty-state-text" style={{ fontSize: '17px', fontWeight: '800' }}>
                  Nenhum paciente cadastrado ainda
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '400px', margin: '6px auto 20px auto' }}>
                  Comece agora cadastrando seu primeiro paciente com anamnese completa em 3 abas.
                </p>
                <button
                  className="btn-primary"
                  style={{ width: 'auto', margin: '0 auto' }}
                  onClick={() => setCurrentView('novo-paciente')}
                >
                  <Plus size={16} /> Cadastrar Primeiro Paciente
                </button>
              </div>
            ) : filteredPacientes.length === 0 ? (
              <div className="empty-state-box">
                <p style={{ color: 'var(--text-muted)' }}>Nenhum paciente encontrado com o filtro selecionado.</p>
              </div>
            ) : (
              <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '16px 24px' }}>Nome do Paciente</th>
                      <th style={{ padding: '16px 24px' }}>Objetivo</th>
                      <th style={{ padding: '16px 24px' }}>Data da Última Consulta</th>
                      <th style={{ padding: '16px 24px', textAlign: 'right' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPacientes.map((paciente) => {
                      const objetivosList = paciente.objetivos?.length > 0
                        ? paciente.objetivos.join(', ')
                        : paciente.objetivo_texto || 'Reeducação alimentar';

                      return (
                        <tr
                          key={paciente.id}
                          style={{ borderBottom: '1px solid #f4f4f5', cursor: 'pointer', transition: 'background 0.15s' }}
                          onClick={() => handleOpenPatientProfile(paciente.id)}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          {/* Nome */}
                          <td style={{ padding: '18px 24px' }}>
                            <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '15px' }}>
                              {paciente.nome}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {paciente.telefone || paciente.email || 'Sem contato'}
                            </div>
                          </td>

                          {/* Objetivo */}
                          <td style={{ padding: '18px 24px' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '600' }}>
                              {objetivosList}
                            </span>
                          </td>

                          {/* Data da Última Consulta */}
                          <td style={{ padding: '18px 24px' }}>
                            {paciente.ultima_consulta_data ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: 'var(--primary)' }}>
                                <CalendarDays size={14} />
                                {new Date(paciente.ultima_consulta_data).toLocaleDateString('pt-BR')}
                              </div>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Nenhuma consulta realizada
                              </span>
                            )}
                          </td>

                          {/* Ação */}
                          <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                              {(paciente.whatsapp || paciente.telefone) && (
                                <button
                                  className="btn-icon-secondary"
                                  style={{ color: '#16a34a', borderColor: '#bbf7d0', padding: '6px 10px' }}
                                  onClick={(e) => handleQuickWhatsApp(e, paciente)}
                                  title="Chamar no WhatsApp"
                                >
                                  <MessageCircle size={14} />
                                </button>
                              )}

                              <button
                                className="btn-icon-secondary"
                                style={{ padding: '6px 14px', fontSize: '12px' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPatientProfile(paciente.id);
                                }}
                              >
                                Ver Perfil <ChevronRight size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: FORMULÁRIO DE CADASTRO COM 3 ABAS (Prompt 4) */}
        {/* ========================================================================= */}
        {currentView === 'novo-paciente' && (
          <PatientFormScreen
            user={user}
            onCancel={() => setCurrentView('pacientes')}
            onSaveSuccess={handlePatientSaved}
          />
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: PERFIL COMPLETO DO PACIENTE (Prompt 4) */}
        {/* ========================================================================= */}
        {currentView === 'perfil-paciente' && selectedPatientId && (
          <PatientProfileScreen
            patientId={selectedPatientId}
            user={user}
            onBack={() => {
              setCurrentView('pacientes');
              setSelectedPatientId(null);
            }}
            onDeleted={handlePatientDeleted}
          />
        )}
      </main>
    </div>
  );
}
