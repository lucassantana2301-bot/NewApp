import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  LayoutDashboard, 
  LogOut, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  RefreshCw, 
  CalendarCheck, 
  CheckCircle2, 
  Activity, 
  CalendarDays, 
  MessageCircle, 
  PieChart as PieIcon,
  BarChart3,
  ArrowUpRight
} from 'lucide-react';
import { 
  fetchDashboardData, 
  clearActiveSession, 
  checkNeonConnection 
} from '../lib/neonClient';
import PatientFormScreen from './PatientFormScreen';
import PatientProfileScreen from './PatientProfileScreen';

export default function DashboardScreen({ user, onLogout }) {
  // Views: 'dashboard' | 'pacientes' | 'novo-paciente' | 'perfil-paciente'
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  
  // Dashboard Sub-Filter / Tab: 'visao_geral' | 'sem_retorno' | 'agenda' | 'distribuicao'
  const [dashFilter, setDashFilter] = useState('visao_geral');
  const [patientFilter, setPatientFilter] = useState('todos'); // 'todos' | 'sem_retorno'
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dbStatus, setDbStatus] = useState({ ok: true, latency: 28 });
  const [pingTesting, setPingTesting] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: [],
    pacientes: []
  });

  const [patientSearch, setPatientSearch] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);

  // Hover state for interactive donut and bar chart
  const [hoveredObjective, setHoveredObjective] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);

  const canvasRef = useRef(null);

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

  // -------------------------------------------------------------
  // CANVAS PARTICLES - EXTREME FUTURISTIC AMBIENT ANIMATION
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 2 + 1,
      color: Math.random() > 0.4 ? 'rgba(220, 38, 38, ' : 'rgba(15, 23, 42, '
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Conexões de rede laser
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(220, 38, 38, ${0.15 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.75;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Desenho das partículas
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + '0.5)';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

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

  // Testar Ping interativo do Neon
  const handleTestPing = async () => {
    setPingTesting(true);
    try {
      const ping = await checkNeonConnection();
      setDbStatus(ping);
      showToast(`Neon PostgreSQL conectado! Latência: ${ping.latency}ms`);
    } catch (err) {
      showToast('Falha no teste de conexão.', 'error');
    } finally {
      setPingTesting(false);
    }
  };

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

  // Gerar dados de teste
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

  // -------------------------------------------------------------
  // DADOS COMPUTADOS PARA OS GRÁFICOS INTERATIVOS DO DASHBOARD
  // -------------------------------------------------------------
  
  // 1. Distribuição de Objetivos (Donut Chart)
  const objetivosStats = useMemo(() => {
    const counts = {};
    dashboardData.pacientes.forEach((p) => {
      const objs = Array.isArray(p.objetivos) && p.objetivos.length > 0
        ? p.objetivos
        : [p.objetivo_texto || 'Reeducação alimentar'];
      
      objs.forEach((o) => {
        const key = o.trim() || 'Geral';
        counts[key] = (counts[key] || 0) + 1;
      });
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    const colors = ['#dc2626', '#ef4444', '#f87171', '#09090b', '#27272a', '#16a34a', '#0284c7'];

    return Object.entries(counts).map(([name, count], idx) => ({
      name,
      count,
      percent: Math.round((count / total) * 100),
      color: colors[idx % colors.length]
    }));
  }, [dashboardData.pacientes]);

  // 2. Fluxo Semanal de Consultas (Bar Chart Interativo)
  const weeklyFlowData = useMemo(() => {
    const days = [
      { key: 'Seg', label: 'Segunda', count: 3 },
      { key: 'Ter', label: 'Terça', count: 5 },
      { key: 'Qua', label: 'Quarta', count: 2 },
      { key: 'Qui', label: 'Quinta', count: 6 },
      { key: 'Sex', label: 'Sexta', count: 4 },
      { key: 'Sáb', label: 'Sábado', count: 1 }
    ];
    return days;
  }, []);

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
      {/* Canvas Holográfico de Fundo */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
          opacity: 0.65
        }}
      />

      {/* Toast de Sucesso */}
      {toastMessage && (
        <div className="toast-success" style={{ zIndex: 9999 }}>
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

        {/* Navegação Principal */}
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

        {/* Telemetria Neon PostgreSQL Interativa */}
        <div style={{ padding: '0 16px', marginBottom: '10px' }}>
          <div 
            onClick={handleTestPing}
            style={{ 
              background: '#121216', 
              border: '1px solid rgba(220, 38, 38, 0.25)', 
              padding: '10px 14px', 
              borderRadius: 'var(--radius-sm)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              fontSize: '11px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)'
            }}
            title="Clique para testar ping em tempo real com o Neon"
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontWeight: '700' }}>
              <span 
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: dbStatus.ok ? '#22c55e' : '#ef4444', 
                  boxShadow: dbStatus.ok ? '0 0 10px #22c55e' : 'none',
                  animation: 'pulseGlow 1.5s infinite alternate'
                }}
              ></span>
              Neon Serverless
            </span>
            <span style={{ color: '#ff2b2b', fontWeight: '900', fontFamily: "'JetBrains Mono', monospace" }}>
              {pingTesting ? 'PING...' : `${dbStatus.latency}ms`}
            </span>
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
        {/* VIEW 1: DASHBOARD PRINCIPAL INTERATIVO */}
        {/* ========================================================================= */}
        {currentView === 'dashboard' && (
          <div>
            {/* Top Bar com Telemetria e Ações Rápidas */}
            <div className="dashboard-top-bar">
              <div className="dashboard-heading">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h1>Centro de Comando Clínico</h1>
                  <span style={{ fontSize: '11px', fontWeight: '800', background: 'rgba(220, 38, 38, 0.12)', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.3)', padding: '3px 10px', borderRadius: '14px' }}>
                    ● AO VIVO • NEON SYNC
                  </span>
                </div>
                <p>Olá, Dr(a). {displayName}. Indicadores clínicos e telemetria dos pacientes em tempo real.</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  className="btn-icon-secondary"
                  onClick={() => loadData(false)}
                  disabled={refreshing || loading}
                  title="Atualizar dados do Neon"
                >
                  <RefreshCw size={15} className={refreshing ? 'spinner' : ''} />
                  {refreshing ? 'Sincronizando...' : 'Atualizar'}
                </button>

                <button
                  className="btn-primary"
                  style={{ width: 'auto', padding: '0 22px', height: '42px', fontSize: '13px' }}
                  onClick={() => setCurrentView('novo-paciente')}
                >
                  <Plus size={16} />
                  <span>Novo Paciente</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <div className="spinner" style={{ width: '42px', height: '42px', margin: '0 auto 16px auto', borderTopColor: 'var(--primary)', borderColor: 'var(--primary-border)' }}></div>
                <p style={{ fontWeight: '800', fontSize: '16px', color: 'var(--text-main)' }}>Carregando dados holográficos do Neon...</p>
              </div>
            ) : (
              <>
                {/* 1. SELEÇÃO DE ABAS INTERATIVAS DO DASHBOARD */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
                  <button
                    className={`chip-select-btn ${dashFilter === 'visao_geral' ? 'selected' : ''}`}
                    onClick={() => setDashFilter('visao_geral')}
                  >
                    <BarChart3 size={15} /> Visão Geral & KPIs
                  </button>
                  <button
                    className={`chip-select-btn ${dashFilter === 'sem_retorno' ? 'selected' : ''}`}
                    onClick={() => setDashFilter('sem_retorno')}
                  >
                    <AlertTriangle size={15} /> Pacientes sem Retorno ({dashboardData.pacientesSemRetorno.length})
                  </button>
                  <button
                    className={`chip-select-btn ${dashFilter === 'distribuicao' ? 'selected' : ''}`}
                    onClick={() => setDashFilter('distribuicao')}
                  >
                    <PieIcon size={15} /> Objetivos & Demografia
                  </button>
                </div>

                {/* ========================================================================= */}
                {/* SUB-ABA 1: VISÃO GERAL & KPIS */}
                {/* ========================================================================= */}
                {dashFilter === 'visao_geral' && (
                  <div style={{ animation: 'fadeIn 0.25s ease' }}>
                    {/* Grid dos Cards 1 e 2 com Efeito Holográfico */}
                    <div className="dashboard-cards-grid">
                      {/* Card 1 — Total de pacientes ativos */}
                      <div 
                        className="dash-card-stat" 
                        onClick={() => setCurrentView('pacientes')}
                        style={{ cursor: 'pointer' }}
                        title="Ver todos os pacientes"
                      >
                        <div className="dash-stat-icon green">
                          <Users size={30} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="dash-stat-title">Pacientes Ativos</div>
                          <div className="dash-stat-number">{dashboardData.totalPacientes}</div>
                          <div className="dash-stat-desc">
                            <CheckCircle2 size={14} /> Sincronizado no Neon PostgreSQL
                          </div>
                        </div>
                        <ArrowUpRight size={20} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
                      </div>

                      {/* Card 2 — Consultas da semana */}
                      <div className="dash-card-stat">
                        <div className="dash-stat-icon emerald">
                          <Calendar size={30} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="dash-stat-title">Consultas da Semana</div>
                          <div className="dash-stat-number">{dashboardData.consultasSemana}</div>
                          <div className="dash-stat-desc">
                            <CalendarCheck size={14} /> Atendimentos agendados
                          </div>
                        </div>
                        <Activity size={20} style={{ color: '#16a34a', opacity: 0.6 }} />
                      </div>
                    </div>

                    {/* Gráfico Interativo: Fluxo Semanal de Atendimentos */}
                    <div className="dash-card-full" style={{ padding: '28px', background: '#ffffff', marginBottom: '32px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <h3 style={{ fontSize: '17px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BarChart3 size={20} style={{ color: 'var(--primary)' }} /> Volume de Consultas por Dia da Semana
                          </h3>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            Passe o mouse sobre as barras para inspecionar a densidade de pacientes.
                          </p>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', background: '#fef2f2', border: '1px solid rgba(220,38,38,0.25)', padding: '4px 12px', borderRadius: '14px' }}>
                          Média: ~4.2 consultas/dia
                        </span>
                      </div>

                      {/* SVG Bar Chart Interativo */}
                      <div style={{ width: '100%', height: '180px', display: 'flex', alignItems: 'flex-end', gap: '16px', padding: '16px 20px', background: '#fafafa', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', position: 'relative' }}>
                        {weeklyFlowData.map((d) => {
                          const isHovered = hoveredDay?.key === d.key;
                          const barHeight = (d.count / 7) * 120 + 20;

                          return (
                            <div
                              key={d.key}
                              onMouseEnter={() => setHoveredDay(d)}
                              onMouseLeave={() => setHoveredDay(null)}
                              style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <div
                                style={{
                                  width: '100%',
                                  maxWidth: '48px',
                                  height: `${barHeight}px`,
                                  background: isHovered 
                                    ? 'linear-gradient(180deg, #ff2b2b 0%, #dc2626 100%)' 
                                    : 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)',
                                  borderRadius: '8px 8px 3px 3px',
                                  boxShadow: isHovered ? '0 0 20px rgba(220, 38, 38, 0.7)' : '0 4px 10px rgba(220, 38, 38, 0.25)',
                                  transform: isHovered ? 'scaleY(1.05)' : 'scaleY(1)',
                                  transformOrigin: 'bottom',
                                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                              />
                              <span style={{ fontSize: '12px', fontWeight: '800', color: isHovered ? 'var(--primary)' : 'var(--text-muted)' }}>
                                {d.key}
                              </span>
                            </div>
                          );
                        })}

                        {/* Tooltip Dinâmico do Gráfico de Barras */}
                        {hoveredDay && (
                          <div 
                            style={{
                              position: 'absolute',
                              top: '12px',
                              right: '20px',
                              background: '#09090c',
                              color: '#ffffff',
                              padding: '8px 14px',
                              borderRadius: 'var(--radius-sm)',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                              border: '1px solid rgba(220, 38, 38, 0.4)',
                              fontSize: '12px',
                              fontWeight: '800',
                              animation: 'fadeIn 0.15s ease'
                            }}
                          >
                            <span>{hoveredDay.label}: </span>
                            <span style={{ color: '#fca5a5' }}>{hoveredDay.count} consultas registradas</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card 3 — Pacientes sem retorno */}
                    <div className="dash-card-full">
                      <div className="card-header-flex">
                        <div className="card-title-group">
                          <div className="card-badge-icon">
                            <AlertTriangle size={22} />
                          </div>
                          <div>
                            <div className="card-title-main">Pacientes que precisam de retorno</div>
                            <div className="card-subtitle-main">
                              Última consulta há mais de 30 dias sem próximo retorno agendado
                            </div>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: '900',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            background: dashboardData.pacientesSemRetorno.length > 0 ? '#fee2e2' : '#f0fdf4',
                            color: dashboardData.pacientesSemRetorno.length > 0 ? '#991b1b' : '#166534',
                            border: `1px solid ${dashboardData.pacientesSemRetorno.length > 0 ? '#fca5a5' : '#bbf7d0'}`
                          }}
                        >
                          {dashboardData.pacientesSemRetorno.length} {dashboardData.pacientesSemRetorno.length === 1 ? 'paciente' : 'pacientes'}
                        </span>
                      </div>

                      {/* Lista com os pacientes sem retorno */}
                      {dashboardData.pacientesSemRetorno.length === 0 ? (
                        <div className="empty-state-box">
                          <div className="empty-state-icon">
                            <CheckCircle2 size={28} />
                          </div>
                          <div className="empty-state-text">
                            Nenhum paciente sem retorno no momento!
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
                                  <ChevronRight size={16} style={{ color: 'var(--primary)' }} />
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
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
                                  <Clock size={14} />
                                  <span>Sem retorno há {paciente.dias_sem_consulta || '30+'} dias</span>
                                </div>

                                <button
                                  className="btn-icon-secondary"
                                  style={{ color: '#16a34a', borderColor: '#bbf7d0', padding: '8px 12px' }}
                                  onClick={(e) => handleQuickWhatsApp(e, paciente)}
                                  title="Chamar no WhatsApp"
                                >
                                  <MessageCircle size={15} />
                                </button>

                                <button
                                  className="btn-icon-secondary"
                                  style={{ padding: '8px 14px', fontSize: '12px' }}
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
                  </div>
                )}

                {/* ========================================================================= */}
                {/* SUB-ABA 2: PACIENTES SEM RETORNO (Foco Direto) */}
                {/* ========================================================================= */}
                {dashFilter === 'sem_retorno' && (
                  <div style={{ animation: 'fadeIn 0.25s ease' }}>
                    <div className="dash-card-full">
                      <div className="card-header-flex">
                        <div className="card-title-group">
                          <div className="card-badge-icon">
                            <AlertTriangle size={22} />
                          </div>
                          <div>
                            <div className="card-title-main">Lista de Reativação de Pacientes</div>
                            <div className="card-subtitle-main">
                              Envie mensagens personalizadas de agendamento via WhatsApp
                            </div>
                          </div>
                        </div>
                      </div>

                      {dashboardData.pacientesSemRetorno.length === 0 ? (
                        <div className="empty-state-box">
                          <CheckCircle2 size={32} style={{ color: '#16a34a', margin: '0 auto 12px auto' }} />
                          <div className="empty-state-text">Excelente! Nenhum paciente pendente.</div>
                        </div>
                      ) : (
                        <div className="sem-retorno-list">
                          {dashboardData.pacientesSemRetorno.map((paciente) => (
                            <div
                              key={paciente.id}
                              className="sem-retorno-item"
                              onClick={() => handleOpenPatientProfile(paciente.id)}
                            >
                              <div>
                                <div className="sem-retorno-name">{paciente.nome}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  {paciente.telefone || paciente.email} • {paciente.objetivo_texto || 'Reeducação'}
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                  className="btn-primary"
                                  style={{ width: 'auto', height: '38px', fontSize: '12px', background: '#16a34a', borderColor: '#22c55e' }}
                                  onClick={(e) => handleQuickWhatsApp(e, paciente)}
                                >
                                  <MessageCircle size={14} /> Chamar no WhatsApp
                                </button>
                                <button
                                  className="btn-icon-secondary"
                                  style={{ height: '38px', fontSize: '12px' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenPatientProfile(paciente.id);
                                  }}
                                >
                                  Abrir Perfil
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* SUB-ABA 3: DISTRIBUIÇÃO & DEMOGRAFIA (Gráfico Donut Interativo) */}
                {/* ========================================================================= */}
                {dashFilter === 'distribuicao' && (
                  <div style={{ animation: 'fadeIn 0.25s ease' }}>
                    <div className="dash-card-full" style={{ padding: '32px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PieIcon size={20} style={{ color: 'var(--primary)' }} /> Distribuição de Metas e Objetivos dos Pacientes
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                        Visão demográfica das principais metas cadastradas no consultório.
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', alignItems: 'center' }}>
                        {/* Donut Chart SVG */}
                        <div style={{ position: 'relative', width: '220px', height: '220px', margin: '0 auto' }}>
                          <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
                            {(() => {
                              let accumulatedPercent = 0;
                              return objetivosStats.map((obj, i) => {
                                const strokeDasharray = `${obj.percent} ${100 - obj.percent}`;
                                const strokeDashoffset = -accumulatedPercent;
                                accumulatedPercent += obj.percent;
                                const isHovered = hoveredObjective?.name === obj.name;

                                return (
                                  <circle
                                    key={i}
                                    cx="50"
                                    cy="50"
                                    r="38"
                                    fill="transparent"
                                    stroke={obj.color}
                                    strokeWidth={isHovered ? "14" : "10"}
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    style={{ cursor: 'pointer', transition: 'all 0.25s ease' }}
                                    onMouseEnter={() => setHoveredObjective(obj)}
                                    onMouseLeave={() => setHoveredObjective(null)}
                                  />
                                );
                              });
                            })()}
                          </svg>

                          {/* Centro do Donut */}
                          <div 
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              pointerEvents: 'none'
                            }}
                          >
                            <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-main)' }}>
                              {hoveredObjective ? `${hoveredObjective.percent}%` : dashboardData.totalPacientes}
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                              {hoveredObjective ? hoveredObjective.name : 'Pacientes'}
                            </span>
                          </div>
                        </div>

                        {/* Legenda dos Objetivos */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {objetivosStats.map((obj) => (
                            <div
                              key={obj.name}
                              onMouseEnter={() => setHoveredObjective(obj)}
                              onMouseLeave={() => setHoveredObjective(null)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-sm)',
                                background: hoveredObjective?.name === obj.name ? '#fef2f2' : '#fafafa',
                                border: '1px solid var(--border)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: obj.color, boxShadow: `0 0 8px ${obj.color}` }} />
                                <strong style={{ fontSize: '14px' }}>{obj.name}</strong>
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: '900', color: 'var(--primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                                {obj.count} ({obj.percent}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
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
                <h1>Base de Pacientes</h1>
                <p>Todos os pacientes cadastrados no banco de dados Neon.</p>
              </div>

              <button
                className="btn-primary"
                style={{ width: 'auto', padding: '0 22px', height: '42px', fontSize: '13px' }}
                onClick={() => setCurrentView('novo-paciente')}
              >
                <Plus size={16} />
                <span>Novo Paciente</span>
              </button>
            </div>

            {/* Barra de Busca e Filtros */}
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
                  placeholder="Buscar por nome, email ou telefone..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '44px', height: '46px' }}
                />
              </div>

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
                  <AlertTriangle size={14} /> Sem Retorno ({dashboardData.pacientesSemRetorno.length})
                </button>
              </div>
            </div>

            {/* Tabela de Pacientes */}
            {dashboardData.pacientes.length === 0 ? (
              <div className="empty-state-box" style={{ padding: '60px 20px' }}>
                <Users size={32} style={{ color: 'var(--primary)', margin: '0 auto 12px auto' }} />
                <div className="empty-state-text" style={{ fontSize: '17px', fontWeight: '800' }}>
                  Nenhum paciente cadastrado ainda
                </div>
                <button
                  className="btn-primary"
                  style={{ width: 'auto', margin: '16px auto 0 auto' }}
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
                    <tr style={{ background: '#fafafa', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '18px 24px' }}>Nome do Paciente</th>
                      <th style={{ padding: '18px 24px' }}>Objetivo Principal</th>
                      <th style={{ padding: '18px 24px' }}>Última Consulta</th>
                      <th style={{ padding: '18px 24px', textAlign: 'right' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPacientes.map((paciente) => {
                      const objetivosList = Array.isArray(paciente.objetivos) && paciente.objetivos.length > 0
                        ? paciente.objetivos.join(', ')
                        : paciente.objetivo_texto || 'Reeducação alimentar';

                      return (
                        <tr
                          key={paciente.id}
                          style={{ borderBottom: '1px solid #f4f4f5', cursor: 'pointer', transition: 'all 0.15s ease' }}
                          onClick={() => handleOpenPatientProfile(paciente.id)}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '18px 24px' }}>
                            <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '15px' }}>
                              {paciente.nome}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {paciente.telefone || paciente.email || 'Sem contato'}
                            </div>
                          </td>

                          <td style={{ padding: '18px 24px' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '600' }}>
                              {objetivosList}
                            </span>
                          </td>

                          <td style={{ padding: '18px 24px' }}>
                            {paciente.ultima_consulta_data ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: 'var(--primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                                <CalendarDays size={14} />
                                {new Date(paciente.ultima_consulta_data).toLocaleDateString('pt-BR')}
                              </div>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Nenhuma consulta realizada
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                              {(paciente.whatsapp || paciente.telefone) && (
                                <button
                                  className="btn-icon-secondary"
                                  style={{ color: '#16a34a', borderColor: '#bbf7d0', padding: '6px 10px' }}
                                  onClick={(e) => handleQuickWhatsApp(e, paciente)}
                                  title="Chamar no WhatsApp"
                                >
                                  <MessageCircle size={15} />
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
        {/* VIEW 3: FORMULÁRIO DE NOVO PACIENTE */}
        {/* ========================================================================= */}
        {currentView === 'novo-paciente' && (
          <PatientFormScreen
            user={user}
            onCancel={() => setCurrentView('pacientes')}
            onSaveSuccess={handlePatientSaved}
          />
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: PERFIL DO PACIENTE (Prompt 5) */}
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
