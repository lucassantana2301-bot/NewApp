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
  X, 
  CalendarCheck, 
  CheckCircle2, 
  Weight, 
  Ruler, 
  Activity,
  Leaf
} from 'lucide-react';
import { 
  fetchDashboardData, 
  clearActiveSession, 
  seedDemoData, 
  createPaciente,
  fetchPacienteDetalhes 
} from '../lib/neonClient';

export default function DashboardScreen({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'pacientes'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: [],
    pacientes: []
  });

  // Modals
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [newPatientForm, setNewPatientForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    whatsapp: '',
    data_nascimento: '',
    sexo: 'Feminino',
    peso_inicial: '',
    altura: '',
    objetivo_texto: '',
    observacoes: ''
  });
  const [savingPatient, setSavingPatient] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const displayName = user?.nome || 'Nutricionista';
  const displayEmail = user?.email || '';

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Carregar dados em tempo real do Neon
  const loadData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);

    try {
      if (user?.id) {
        const data = await fetchDashboardData(user.id);
        setDashboardData(data);
      }
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
  const handleOpenPatientProfile = async (patient) => {
    setSelectedPatient(patient);
    setLoadingDetails(true);
    try {
      const details = await fetchPacienteDetalhes(patient.id, user.id);
      setPatientDetails(details);
    } catch (err) {
      console.error('Erro ao buscar detalhes:', err);
      setPatientDetails({ paciente: patient, consultas: [] });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Cadastrar Novo Paciente
  const handleCreatePatientSubmit = async (e) => {
    e.preventDefault();
    if (!newPatientForm.nome.trim()) return;

    setSavingPatient(true);
    try {
      await createPaciente(newPatientForm, user.id);
      setIsNewPatientModalOpen(false);
      setNewPatientForm({
        nome: '',
        email: '',
        telefone: '',
        whatsapp: '',
        data_nascimento: '',
        sexo: 'Feminino',
        peso_inicial: '',
        altura: '',
        objetivo_texto: '',
        observacoes: ''
      });
      await loadData(false);
    } catch (err) {
      alert('Erro ao cadastrar paciente: ' + (err.message || 'Verifique a conexão'));
    } finally {
      setSavingPatient(false);
    }
  };

  // Gerar dados de teste caso a tabela esteja vazia
  const handleSeedDemoData = async () => {
    setDemoLoading(true);
    try {
      await seedDemoData(user.id);
      await loadData(false);
    } catch (err) {
      alert('Erro ao gerar dados de teste: ' + err.message);
    } finally {
      setDemoLoading(false);
    }
  };

  const filteredPacientes = dashboardData.pacientes.filter((p) =>
    p.nome?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.email?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.telefone?.includes(patientSearch)
  );

  return (
    <div className="dashboard-app-layout">
      {/* Menu Lateral Fixo com Logo "Nutri lucas " */}
      <aside className="sidebar-fixed">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Leaf size={22} strokeWidth={2.4} />
          </div>
          <div className="sidebar-brand-text">
            Nutri <span>lucas </span>
          </div>
        </div>

        {/* Navegação */}
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'pacientes' ? 'active' : ''}`}
            onClick={() => setActiveTab('pacientes')}
          >
            <Users size={18} />
            <span>Pacientes</span>
          </button>
        </nav>

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
        {/* Top Header */}
        <div className="dashboard-top-bar">
          <div className="dashboard-heading">
            <h1>{activeTab === 'dashboard' ? 'Dashboard Principal' : 'Gestão de Pacientes'}</h1>
            <p>
              {activeTab === 'dashboard'
                ? `Olá, ${displayName}. Acompanhe os indicadores em tempo real sincronizados com o Neon.`
                : 'Gerencie o cadastro, histórico e consultas dos seus pacientes.'}
            </p>
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
              onClick={() => setIsNewPatientModalOpen(true)}
            >
              <Plus size={16} />
              <span>Novo Paciente</span>
            </button>
          </div>
        </div>

        {/* Seção 1: Visualização do Dashboard */}
        {activeTab === 'dashboard' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 16px auto', borderTopColor: 'var(--primary)' }}></div>
                <p style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Carregando dados em tempo real do Neon...</p>
              </div>
            ) : (
              <>
                {/* 3 Cards de Informação Principais */}
                
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
                        fontWeight: '700',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        background: dashboardData.pacientesSemRetorno.length > 0 ? '#fef3c7' : '#ecfdf5',
                        color: dashboardData.pacientesSemRetorno.length > 0 ? '#b45309' : '#059669',
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
                          onClick={() => handleOpenPatientProfile(paciente)}
                          title="Clique para ver o perfil completo do paciente"
                        >
                          <div>
                            <div className="sem-retorno-name">
                              {paciente.nome}
                              <ChevronRight size={15} style={{ opacity: 0.6 }} />
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '14px' }}>
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

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="sem-retorno-badge-alert">
                              <Clock size={13} />
                              <span>Sem retorno há {paciente.dias_sem_consulta || '30+'} dias</span>
                            </div>
                            <button
                              className="btn-icon-secondary"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPatientProfile(paciente);
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
                      background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                      border: '1px solid var(--primary-border)',
                      borderRadius: 'var(--radius-xl)',
                      padding: '24px 28px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary-hover)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={18} /> Banco de dados pronto no Neon!
                      </h4>
                      <p style={{ fontSize: '13px', color: '#065f46', marginTop: '4px' }}>
                        Você pode cadastrar seus pacientes ou gerar 3 pacientes de exemplo para testar os 3 cards do Dashboard.
                      </p>
                    </div>
                    <button
                      className="btn-primary"
                      style={{ width: 'auto', height: '40px', padding: '0 18px', fontSize: '13px' }}
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

        {/* Seção 2: Visualização da Lista de Pacientes */}
        {activeTab === 'pacientes' && (
          <div>
            {/* Barra de Pesquisa e Filtros */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Pesquisar paciente por nome, email ou telefone..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '42px', height: '46px' }}
                />
              </div>
            </div>

            {/* Tabela de Pacientes */}
            <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              {filteredPacientes.length === 0 ? (
                <div className="empty-state-box" style={{ margin: '30px' }}>
                  <div className="empty-state-icon">
                    <Users size={26} />
                  </div>
                  <div className="empty-state-text">Nenhum paciente encontrado</div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Clique no botão "Novo Paciente" para cadastrar o primeiro.
                  </p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '16px 20px' }}>Nome do Paciente</th>
                      <th style={{ padding: '16px 20px' }}>Contato</th>
                      <th style={{ padding: '16px 20px' }}>Objetivo</th>
                      <th style={{ padding: '16px 20px' }}>Última Consulta</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPacientes.map((paciente) => (
                      <tr
                        key={paciente.id}
                        style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.15s' }}
                        onClick={() => handleOpenPatientProfile(paciente)}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '16px 20px' }}>
                          <strong style={{ color: 'var(--text-main)' }}>{paciente.nome}</strong>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{paciente.sexo || 'Não informado'}</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div>{paciente.telefone || 'Sem telefone'}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{paciente.email || '-'}</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                            {paciente.objetivo_texto || 'Avaliação nutricional'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          {paciente.ultima_consulta_data ? (
                            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary)' }}>
                              {new Date(paciente.ultima_consulta_data).toLocaleDateString('pt-BR')}
                            </span>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sem consultas</span>
                          )}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <button
                            className="btn-icon-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPatientProfile(paciente);
                            }}
                          >
                            Ver Perfil
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal: Perfil do Paciente (quando clicado no Card 3 ou na lista) */}
      {selectedPatient && (
        <div className="modal-overlay" onClick={() => setSelectedPatient(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">
                <UserCheck size={22} style={{ color: 'var(--primary)' }} />
                <span>Perfil do Paciente</span>
              </div>
              <button className="btn-close" onClick={() => setSelectedPatient(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px' }}>
                {selectedPatient.nome?.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>{selectedPatient.nome}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{selectedPatient.email || 'Sem e-mail cadastrado'}</p>
              </div>
            </div>

            {loadingDetails ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <div className="spinner" style={{ width: '28px', height: '28px', margin: '0 auto', borderTopColor: 'var(--primary)' }}></div>
              </div>
            ) : (
              <>
                <div className="patient-detail-grid">
                  <div className="patient-info-box">
                    <div className="patient-info-lbl">Telefone / WhatsApp</div>
                    <div className="patient-info-val">{selectedPatient.telefone || selectedPatient.whatsapp || 'Não informado'}</div>
                  </div>

                  <div className="patient-info-box">
                    <div className="patient-info-lbl">Sexo</div>
                    <div className="patient-info-val">{selectedPatient.sexo || 'Não informado'}</div>
                  </div>

                  <div className="patient-info-box">
                    <div className="patient-info-lbl">Peso Inicial</div>
                    <div className="patient-info-val">{selectedPatient.peso_inicial ? `${selectedPatient.peso_inicial} kg` : 'Não registrado'}</div>
                  </div>

                  <div className="patient-info-box">
                    <div className="patient-info-lbl">Altura</div>
                    <div className="patient-info-val">{selectedPatient.altura ? `${selectedPatient.altura} m` : 'Não registrada'}</div>
                  </div>
                </div>

                <div className="patient-info-box" style={{ marginBottom: '20px' }}>
                  <div className="patient-info-lbl">Objetivo Principal</div>
                  <div className="patient-info-val" style={{ color: 'var(--primary)', fontWeight: '700' }}>
                    {selectedPatient.objetivo_texto || 'Reeducação alimentar & saúde'}
                  </div>
                </div>

                {/* Histórico de Consultas */}
                <h4 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '10px' }}>Histórico de Consultas</h4>
                {patientDetails?.consultas?.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Nenhuma consulta registrada para este paciente ainda.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                    {patientDetails?.consultas?.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          padding: '10px 14px',
                          background: '#f8fafc',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '13px',
                        }}
                      >
                        <div>
                          <strong>Data: {new Date(c.data_consulta).toLocaleDateString('pt-BR')}</strong>
                          {c.peso && <span style={{ marginLeft: '10px', color: 'var(--text-muted)' }}>• Peso: {c.peso} kg</span>}
                        </div>
                        <div>
                          {c.proximo_retorno ? (
                            <span style={{ color: 'var(--primary)', fontWeight: '600' }}>
                              Retorno: {new Date(c.proximo_retorno).toLocaleDateString('pt-BR')}
                            </span>
                          ) : (
                            <span style={{ color: '#d97706', fontWeight: '600' }}>Sem retorno</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setSelectedPatient(null)}>
                Fechar Perfil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cadastrar Novo Paciente */}
      {isNewPatientModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewPatientModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Plus size={20} style={{ color: 'var(--primary)' }} />
                <span>Novo Paciente</span>
              </div>
              <button className="btn-close" onClick={() => setIsNewPatientModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePatientSubmit}>
              <div className="form-group">
                <label className="form-label">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={newPatientForm.nome}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, nome: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input
                    type="email"
                    placeholder="paciente@email.com"
                    value={newPatientForm.email}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Telefone / Celular</label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={newPatientForm.telefone}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, telefone: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Peso Inicial (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 75.5"
                    value={newPatientForm.peso_inicial}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, peso_inicial: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Altura (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 1.72"
                    value={newPatientForm.altura}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, altura: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Objetivo Principal</label>
                <input
                  type="text"
                  placeholder="Ex: Emagrecimento, Hipertrofia, Reeducação"
                  value={newPatientForm.objetivo_texto}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, objetivo_texto: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn-icon-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setIsNewPatientModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 2 }}
                  disabled={savingPatient}
                >
                  {savingPatient ? 'Salvando no Neon...' : 'Cadastrar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
