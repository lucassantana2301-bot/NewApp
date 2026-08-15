import React, { useState, useEffect } from 'react';
import { 
  User, 
  ArrowLeft, 
  Calendar, 
  Phone, 
  Mail, 
  Activity, 
  Clock, 
  Heart, 
  Droplet, 
  AlertTriangle, 
  Plus, 
  Weight, 
  Ruler, 
  Utensils, 
  FileText,
  CalendarCheck,
  CheckCircle2,
  X
} from 'lucide-react';
import { fetchPacienteDetalhes, createConsulta } from '../lib/neonClient';

export default function PatientProfileScreen({ patientId, user, onBack }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [isNewConsultaOpen, setIsNewConsultaOpen] = useState(false);
  const [savingConsulta, setSavingConsulta] = useState(false);
  const [consultaForm, setConsultaForm] = useState({
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    proximo_retorno: '',
    observacoes: ''
  });

  const loadPatientData = async () => {
    setLoading(true);
    try {
      const res = await fetchPacienteDetalhes(patientId, user.id);
      setData(res);
    } catch (err) {
      console.error('Erro ao carregar dados do paciente:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      loadPatientData();
    }
  }, [patientId]);

  const handleCreateConsultaSubmit = async (e) => {
    e.preventDefault();
    setSavingConsulta(true);
    try {
      await createConsulta({
        ...consultaForm,
        paciente_id: patientId
      });
      setIsNewConsultaOpen(false);
      setConsultaForm({
        data_consulta: new Date().toISOString().split('T')[0],
        peso: '',
        cintura: '',
        quadril: '',
        percentual_gordura: '',
        proximo_retorno: '',
        observacoes: ''
      });
      await loadPatientData();
    } catch (err) {
      alert('Erro ao registrar consulta: ' + err.message);
    } finally {
      setSavingConsulta(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 16px auto', borderTopColor: 'var(--primary)' }}></div>
        <p style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Carregando perfil do paciente...</p>
      </div>
    );
  }

  if (!data?.paciente) {
    return (
      <div className="empty-state-box" style={{ margin: '40px 0' }}>
        <p>Paciente não encontrado.</p>
        <button className="btn-primary" style={{ width: 'auto', margin: '16px auto 0 auto' }} onClick={onBack}>
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>
    );
  }

  const { paciente, consultas } = data;

  // Cálculo de IMC
  const pesoNum = parseFloat(paciente.peso_inicial);
  const alturaNum = parseFloat(paciente.altura);
  let imcValor = null;
  let imcClasse = '';
  if (pesoNum && alturaNum && alturaNum > 0) {
    const imc = pesoNum / (alturaNum * alturaNum);
    imcValor = imc.toFixed(1);
    if (imc < 18.5) imcClasse = 'Baixo peso';
    else if (imc < 25) imcClasse = 'Peso normal';
    else if (imc < 30) imcClasse = 'Sobrepeso';
    else imcClasse = 'Obesidade';
  }

  return (
    <div style={{ animation: 'fadeIn 0.25s ease' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={onBack}
            className="btn-icon-secondary"
            style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, justifyContent: 'center' }}
            title="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
              {paciente.nome}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Cadastrado em {new Date(paciente.created_at).toLocaleDateString('pt-BR')} • {paciente.sexo || 'Sexo não informado'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-primary"
            style={{ width: 'auto', padding: '0 18px', height: '40px', fontSize: '13px' }}
            onClick={() => setIsNewConsultaOpen(true)}
          >
            <Plus size={16} /> Nova Consulta
          </button>
        </div>
      </div>

      {/* Grid Principal de Informações */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Card 1: Resumo Antropométrico & Contato */}
        <div className="dash-card-full" style={{ padding: '24px', margin: 0 }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} style={{ color: 'var(--primary)' }} /> Dados Pessoais & Contato
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Telefone / Celular:</span>
              <strong>{paciente.telefone || 'Não informado'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>WhatsApp:</span>
              <strong>{paciente.whatsapp || paciente.telefone || 'Não informado'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>E-mail:</span>
              <strong>{paciente.email || 'Não informado'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Data de Nascimento:</span>
              <strong>
                {paciente.data_nascimento
                  ? new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')
                  : 'Não informada'}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 2: Dados Clínicos & IMC */}
        <div className="dash-card-full" style={{ padding: '24px', margin: 0 }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: 'var(--primary)' }} /> Perfil Clínico & Físico
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div className="patient-info-box" style={{ textAlign: 'center' }}>
              <div className="patient-info-lbl">Peso Inicial</div>
              <div className="patient-info-val" style={{ fontSize: '16px', color: 'var(--primary)' }}>
                {paciente.peso_inicial ? `${paciente.peso_inicial} kg` : '-'}
              </div>
            </div>

            <div className="patient-info-box" style={{ textAlign: 'center' }}>
              <div className="patient-info-lbl">Altura</div>
              <div className="patient-info-val" style={{ fontSize: '16px' }}>
                {paciente.altura ? `${(Number(paciente.altura) * 100).toFixed(0)} cm` : '-'}
              </div>
            </div>

            <div className="patient-info-box" style={{ textAlign: 'center' }}>
              <div className="patient-info-lbl">IMC Inicial</div>
              <div className="patient-info-val" style={{ fontSize: '16px', fontWeight: '800' }}>
                {imcValor ? `${imcValor} (${imcClasse})` : '-'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Objetivo: </span>
              <strong>
                {paciente.objetivos?.join(', ') || paciente.objetivo_texto || 'Reeducação alimentar'}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Atividade Física: </span>
              <strong>
                {paciente.atividade_fisica ? `Sim (${paciente.atividade_fisica_descricao || paciente.nivel_atividade})` : 'Não pratica'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Card de Anamnese & Hábitos Detalhados */}
      <div className="dash-card-full" style={{ padding: '24px', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} style={{ color: 'var(--primary)' }} /> Anamnese & Hábitos
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="patient-info-box">
            <div className="patient-info-lbl">Patologias</div>
            <div className="patient-info-val">
              {paciente.patologias?.length > 0 ? paciente.patologias.join(', ') : 'Nenhuma relatada'}
            </div>
          </div>

          <div className="patient-info-box">
            <div className="patient-info-lbl">Restrições Alimentares</div>
            <div className="patient-info-val">
              {paciente.restricoes_alimentares?.length > 0 ? paciente.restricoes_alimentares.join(', ') : 'Nenhuma relatada'}
            </div>
          </div>

          <div className="patient-info-box">
            <div className="patient-info-lbl">Alergias Alimentares</div>
            <div className="patient-info-val">
              {paciente.alergias?.length > 0 ? paciente.alergias.join(', ') : 'Nenhuma relatada'}
            </div>
          </div>

          <div className="patient-info-box">
            <div className="patient-info-lbl">Rotina & Água</div>
            <div className="patient-info-val">
              {paciente.litros_agua ? `${paciente.litros_agua}L água/dia` : 'Água não informada'} • Acorda {paciente.horario_acorda || '-'} • Dorme {paciente.horario_dorme || '-'}
            </div>
          </div>
        </div>

        {(paciente.medicamentos || paciente.suplementos || paciente.observacoes) && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            {paciente.medicamentos && <div><strong>Medicamentos:</strong> {paciente.medicamentos}</div>}
            {paciente.suplementos && <div><strong>Suplementos:</strong> {paciente.suplementos}</div>}
            {paciente.observacoes && <div><strong>Observações:</strong> {paciente.observacoes}</div>}
          </div>
        )}
      </div>

      {/* Histórico de Consultas */}
      <div className="dash-card-full" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarCheck size={18} style={{ color: 'var(--primary)' }} /> Histórico de Consultas ({consultas.length})
          </h3>
          <button
            className="btn-icon-secondary"
            style={{ fontSize: '12px', padding: '6px 14px' }}
            onClick={() => setIsNewConsultaOpen(true)}
          >
            <Plus size={14} /> Registrar Consulta
          </button>
        </div>

        {consultas.length === 0 ? (
          <div className="empty-state-box" style={{ padding: '28px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Nenhuma consulta registrada para este paciente ainda.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {consultas.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  background: '#f8fafc',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div>
                  <strong style={{ fontSize: '14px' }}>
                    Data: {new Date(c.data_consulta).toLocaleDateString('pt-BR')}
                  </strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {c.peso && <span>Peso: {c.peso} kg • </span>}
                    {c.percentual_gordura && <span>% Gordura: {c.percentual_gordura}% • </span>}
                    {c.observacoes || 'Sem observações'}
                  </div>
                </div>

                <div>
                  {c.proximo_retorno ? (
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', background: 'var(--primary-light)', padding: '4px 10px', borderRadius: '12px' }}>
                      Retorno: {new Date(c.proximo_retorno).toLocaleDateString('pt-BR')}
                    </span>
                  ) : (
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#d97706', background: '#fffbeb', padding: '4px 10px', borderRadius: '12px' }}>
                      Sem retorno
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Nova Consulta */}
      {isNewConsultaOpen && (
        <div className="modal-overlay" onClick={() => setIsNewConsultaOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <CalendarCheck size={20} style={{ color: 'var(--primary)' }} />
                <span>Registrar Consulta</span>
              </div>
              <button className="btn-close" onClick={() => setIsNewConsultaOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateConsultaSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Data da Consulta *</label>
                  <input
                    type="date"
                    required
                    value={consultaForm.data_consulta}
                    onChange={(e) => setConsultaForm({ ...consultaForm, data_consulta: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Próximo Retorno</label>
                  <input
                    type="date"
                    value={consultaForm.proximo_retorno}
                    onChange={(e) => setConsultaForm({ ...consultaForm, proximo_retorno: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 68.5"
                    value={consultaForm.peso}
                    onChange={(e) => setConsultaForm({ ...consultaForm, peso: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cintura (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 75"
                    value={consultaForm.cintura}
                    onChange={(e) => setConsultaForm({ ...consultaForm, cintura: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">% Gordura</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 21.5"
                    value={consultaForm.percentual_gordura}
                    onChange={(e) => setConsultaForm({ ...consultaForm, percentual_gordura: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Observações da Consulta</label>
                <textarea
                  rows={3}
                  placeholder="Evolução do paciente, adesão à dieta, novas metas..."
                  value={consultaForm.observacoes}
                  onChange={(e) => setConsultaForm({ ...consultaForm, observacoes: e.target.value })}
                  className="form-input"
                  style={{ height: 'auto' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="btn-icon-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setIsNewConsultaOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 2 }}
                  disabled={savingConsulta}
                >
                  {savingConsulta ? 'Salvando...' : 'Salvar Consulta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
