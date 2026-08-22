import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Phone, 
  MessageCircle, 
  CheckCircle2, 
  X, 
  Trash2, 
  AlertCircle,
  Activity,
  CalendarCheck,
  Check,
  Clock3
} from 'lucide-react';
import { 
  fetchAgendamentos, 
  createAgendamento, 
  updateAgendamentoStatus, 
  deleteAgendamento 
} from '../lib/neonClient';

export default function ScheduleScreen({ user, pacientes = [], onSelectPatient }) {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Formulário de Novo Agendamento
  const [formData, setFormData] = useState({
    paciente_id: pacientes[0]?.id || '',
    data: new Date().toISOString().split('T')[0],
    hora: '09:00',
    tipo: 'Presencial',
    status: 'Agendado',
    observacoes: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Carregar agendamentos do Neon
  const loadAgendamentos = async () => {
    setLoading(true);
    try {
      if (user?.id) {
        const data = await fetchAgendamentos(user.id);
        setAgendamentos(data);
      }
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgendamentos();
  }, [user?.id]);

  // Atualizar status do agendamento
  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateAgendamentoStatus(id, newStatus);
      showToast(`Status atualizado para: ${newStatus}`);
      await loadAgendamentos();
    } catch (err) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  // Excluir agendamento
  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente cancelar e excluir este agendamento?')) return;
    try {
      await deleteAgendamento(id);
      showToast('Agendamento removido com sucesso.');
      await loadAgendamentos();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  // Disparar Lembrete WhatsApp
  const handleSendWhatsAppReminder = (ag) => {
    const raw = ag.paciente_whatsapp || ag.paciente_telefone || '';
    const clean = raw.replace(/\D/g, '');
    if (!clean) {
      alert('Paciente sem WhatsApp cadastrado.');
      return;
    }

    const dataObj = new Date(ag.data_hora);
    const dataFormatada = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaFormatada = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const nome = ag.paciente_nome?.split(' ')[0] || 'Paciente';
    const msg = `Olá ${nome}! 👋 Passando para lembrar da sua consulta nutricional marcada para o dia *${dataFormatada}* às *${horaFormatada}* (${ag.tipo}). Podemos confirmar sua presença?`;

    window.open(`https://wa.me/55${clean}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Salvar novo agendamento
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.paciente_id) {
      alert('Por favor, selecione um paciente.');
      return;
    }

    setSaving(true);
    try {
      const dataHoraIso = new Date(`${formData.data}T${formData.hora}:00`).toISOString();
      await createAgendamento({
        nutricionista_id: user.id,
        paciente_id: formData.paciente_id,
        data_hora: dataHoraIso,
        tipo: formData.tipo,
        status: formData.status,
        observacoes: formData.observacoes
      });

      setIsModalOpen(false);
      showToast('Consulta agendada com sucesso!');
      await loadAgendamentos();
    } catch (err) {
      alert('Erro ao agendar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Agrupamento de agendamentos por data
  const agendamentosFiltrados = agendamentos.filter((a) => {
    const dataA = new Date(a.data_hora);
    return dataA.getMonth() === currentDate.getMonth() && dataA.getFullYear() === currentDate.getFullYear();
  });

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      {toastMessage && (
        <div className="toast-success">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar da Agenda */}
      <div className="dashboard-top-bar">
        <div className="dashboard-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1>Agenda & Calendário de Consultas</h1>
            <span style={{ fontSize: '11px', fontWeight: '800', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: '14px' }}>
              {agendamentos.length} Agendamentos
            </span>
          </div>
          <p>Organize atendimentos, envie lembretes automáticos no WhatsApp e acompanhe presenças.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn-primary"
            style={{ width: 'auto', padding: '0 20px', height: '42px', fontSize: '13px' }}
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} /> Novo Agendamento
          </button>
        </div>
      </div>

      {/* Controles de Navegação de Mês */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 20px', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CalendarIcon size={20} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '17px', fontWeight: '900', textTransform: 'capitalize', color: 'var(--text-main)' }}>
            {monthName}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-icon-secondary"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
          >
            <ChevronLeft size={16} /> Mês Anterior
          </button>
          <button
            className="btn-icon-secondary"
            onClick={() => setCurrentDate(new Date())}
          >
            Hoje
          </button>
          <button
            className="btn-icon-secondary"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
          >
            Próximo Mês <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Lista de Atendimentos Agendados */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 12px auto' }}></div>
          <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)' }}>Carregando agenda no Neon...</p>
        </div>
      ) : agendamentosFiltrados.length === 0 ? (
        <div className="empty-state-box" style={{ padding: '60px 20px' }}>
          <CalendarCheck size={36} style={{ color: 'var(--primary)', margin: '0 auto 12px auto' }} />
          <div className="empty-state-text" style={{ fontSize: '17px', fontWeight: '800' }}>
            Nenhuma consulta agendada para {monthName}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '380px', margin: '8px auto' }}>
            Clique no botão acima para agendar o retorno ou primeira consulta de um paciente.
          </p>
          <button
            className="btn-primary"
            style={{ width: 'auto', margin: '14px auto 0 auto', padding: '0 20px', height: '40px' }}
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={15} /> Agendar Agora
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {agendamentosFiltrados.map((ag) => {
            const dataObj = new Date(ag.data_hora);
            const dataFormatada = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'short' });
            const horaFormatada = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            const statusColors = {
              Agendado: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
              Confirmado: { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
              Concluído: { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' },
              Cancelado: { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' }
            };

            const st = statusColors[ag.status] || statusColors.Agendado;

            return (
              <div
                key={ag.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: 'var(--shadow-sm)',
                  flexWrap: 'wrap',
                  gap: '16px',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Data e Horário Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  <div 
                    style={{ 
                      background: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)', 
                      color: '#ffffff', 
                      padding: '10px 16px', 
                      borderRadius: 'var(--radius-md)', 
                      textAlign: 'center',
                      minWidth: '80px',
                      border: '1px solid #27272a'
                    }}
                  >
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#f87171', fontWeight: '800' }}>{diaSemana}</div>
                    <div style={{ fontSize: '18px', fontWeight: '900' }}>{dataFormatada}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                      <Clock3 size={11} /> {horaFormatada}
                    </div>
                  </div>

                  {/* Informações do Paciente */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span 
                        style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-main)', cursor: 'pointer' }}
                        onClick={() => onSelectPatient && onSelectPatient(ag.paciente_id)}
                      >
                        {ag.paciente_nome}
                      </span>
                      <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', background: st.bg, color: st.text, border: `1px solid ${st.border}`, fontWeight: '800' }}>
                        {ag.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '12px' }}>
                      <span>Modalidade: <strong>{ag.tipo}</strong></span>
                      {ag.paciente_telefone && <span>• {ag.paciente_telefone}</span>}
                    </div>

                    {ag.observacoes && (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                        "{ag.observacoes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Ações Rápidas de Atendimento e Lembrete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    className="btn-icon-secondary"
                    style={{ color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4' }}
                    onClick={() => handleSendWhatsAppReminder(ag)}
                    title="Enviar Lembrete Automático de Consulta no WhatsApp"
                  >
                    <MessageCircle size={15} /> Lembrete WhatsApp
                  </button>

                  <select
                    value={ag.status}
                    onChange={(e) => handleStatusChange(ag.id, e.target.value)}
                    className="form-input"
                    style={{ height: '38px', width: '130px', padding: '0 8px', fontSize: '12px', fontWeight: '700' }}
                  >
                    <option value="Agendado">Agendado</option>
                    <option value="Confirmado">Confirmado</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>

                  <button
                    className="btn-icon-secondary"
                    style={{ color: 'var(--danger)', padding: '8px 10px' }}
                    onClick={() => handleDelete(ag.id)}
                    title="Excluir Agendamento"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Novo Agendamento */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <CalendarIcon size={20} style={{ color: 'var(--primary)' }} />
                <span>Agendar Nova Consulta</span>
              </div>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label className="form-label">Paciente *</label>
                <select
                  value={formData.paciente_id}
                  onChange={(e) => setFormData({ ...formData, paciente_id: e.target.value })}
                  className="form-input"
                  required
                >
                  <option value="">Selecione o paciente...</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Data *</label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Horário *</label>
                  <input
                    type="time"
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Modalidade</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="form-input"
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="Online (Vídeo)">Online (Vídeo)</option>
                    <option value="Domiciliar">Domiciliar</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-input"
                  >
                    <option value="Agendado">Agendado</option>
                    <option value="Confirmado">Confirmado</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Observações / Motivo da Consulta</label>
                <textarea
                  rows={2}
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="form-input"
                  placeholder="Ex: Retorno de 30 dias, ajustes de calorias..."
                  style={{ height: 'auto', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn-icon-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: 'auto', padding: '0 24px' }}
                  disabled={saving}
                >
                  {saving ? 'Agendando...' : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
