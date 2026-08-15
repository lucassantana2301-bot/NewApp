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
  X,
  MessageCircle,
  Share2,
  Trash2,
  Save,
  Flame,
  Apple,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Printer
} from 'lucide-react';
import { 
  fetchPacienteDetalhes, 
  createConsulta, 
  deleteConsulta,
  deletePaciente,
  fetchPlanoAlimentar,
  savePlanoAlimentar
} from '../lib/neonClient';

const REFEICOES_DEFAULT = [
  { id: 'cafe', nome: 'Café da Manhã', horario: '07:30', alimentos: '2 ovos mexidos + 1 fatia de pão integral + 1 xícara de café sem açúcar' },
  { id: 'lanche_manha', nome: 'Lanche da Manhã', horario: '10:00', alimentos: '1 maçã + 15g de castanhas de caju' },
  { id: 'almoco', nome: 'Almoço', horario: '12:30', alimentos: '120g de filé de frango grelhado + 100g de arroz integral + 1 concha de feijão + Salada verde à vontade com azeite de oliva' },
  { id: 'lanche_tarde', nome: 'Lanche da Tarde', horario: '16:00', alimentos: '1 iogurte natural desnatado + 30g de aveia em flocos + 1 scoop de Whey Protein' },
  { id: 'jantar', nome: 'Jantar', horario: '19:30', alimentos: '130g de patinho moído ou peixe + 120g de batata doce assada + Legumes cozidos (brócolis e cenoura)' },
  { id: 'ceia', nome: 'Ceia', horario: '22:00', alimentos: 'Chá de camomila ou melissa + 1 quadrado de chocolate amargo 70%' }
];

export default function PatientProfileScreen({ patientId, user, onBack, onDeleted }) {
  const [profileTab, setProfileTab] = useState('anamnese'); // 'anamnese' | 'consultas' | 'plano'
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  // Modals & States
  const [isNewConsultaOpen, setIsNewConsultaOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [savingConsulta, setSavingConsulta] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Plano Alimentar
  const [planoAlimentar, setPlanoAlimentar] = useState({
    caloriasTotais: '1850',
    proteinas: '130',
    carboidratos: '180',
    gorduras: '55',
    refeicoes: REFEICOES_DEFAULT,
    orientacoesGerais: 'Beber no mínimo 2.5L de água por dia. Evitar açúcar refinado e refrigerantes. Mastigar devagar e manter horários regulares.'
  });
  const [savingPlano, setSavingPlano] = useState(false);
  const [planoSavedSuccess, setPlanoSavedSuccess] = useState(false);

  // Consulta Form
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

      const planoSalvo = await fetchPlanoAlimentar(patientId);
      if (planoSalvo?.conteudo) {
        setPlanoAlimentar(planoSalvo.conteudo);
      }
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

  // Salvar Consulta
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

  // Excluir Consulta
  const handleDeleteConsultaClick = async (consultaId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta consulta?')) return;
    try {
      await deleteConsulta(consultaId);
      await loadPatientData();
    } catch (err) {
      alert('Erro ao excluir consulta: ' + err.message);
    }
  };

  // Salvar Plano Alimentar
  const handleSavePlanoSubmit = async (e) => {
    if (e) e.preventDefault();
    setSavingPlano(true);
    try {
      await savePlanoAlimentar(patientId, planoAlimentar);
      setPlanoSavedSuccess(true);
      setTimeout(() => setPlanoSavedSuccess(false), 3000);
    } catch (err) {
      alert('Erro ao salvar plano alimentar: ' + err.message);
    } finally {
      setSavingPlano(false);
    }
  };

  // Excluir Paciente
  const handleDeletePatient = async () => {
    setDeleting(true);
    try {
      await deletePaciente(patientId, user.id);
      if (onDeleted) onDeleted();
      else onBack();
    } catch (err) {
      alert('Erro ao excluir paciente: ' + err.message);
      setDeleting(false);
    }
  };

  // Abrir WhatsApp com mensagem pronta
  const handleOpenWhatsApp = (tipo = 'retorno') => {
    const rawPhone = data?.paciente?.whatsapp || data?.paciente?.telefone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (!cleanPhone) {
      alert('Este paciente não possui telefone/WhatsApp cadastrado.');
      return;
    }

    const nomePaciente = data?.paciente?.nome?.split(' ')[0] || 'Paciente';
    let mensagem = '';

    if (tipo === 'retorno') {
      mensagem = `Olá ${nomePaciente}! Aqui é do consultório de nutrição do(a) ${user?.nome || 'Nutricionista'}. Como você está? Gostaria de agendar o seu retorno nutricional para avaliarmos a sua evolução?`;
    } else if (tipo === 'dieta') {
      mensagem = `Olá ${nomePaciente}! Segue o seu plano alimentar personalizado elaborado com foco em ${data?.paciente?.objetivo_texto || 'sua saúde'}:\n\n` +
        planoAlimentar.refeicoes.map(r => `*${r.nome} (${r.horario})*:\n${r.alimentos}`).join('\n\n') +
        `\n\n*Orientações:* ${planoAlimentar.orientacoesGerais}`;
    }

    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 16px auto' }}></div>
        <p style={{ fontWeight: '700', color: 'var(--text-main)' }}>Carregando perfil do paciente...</p>
      </div>
    );
  }

  if (!data?.paciente) {
    return (
      <div className="empty-state-box" style={{ margin: '40px 0' }}>
        <p style={{ fontWeight: '700' }}>Paciente não encontrado.</p>
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
      {/* Top Header com Botões de Ação Rápida */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={onBack}
            className="btn-icon-secondary"
            style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, justifyContent: 'center' }}
            title="Voltar para a listagem"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
              {paciente.nome}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Cadastrado em {new Date(paciente.created_at).toLocaleDateString('pt-BR')} • {paciente.sexo || 'Sexo não informado'}
            </p>
          </div>
        </div>

        {/* Ações Rápidas de Contato e Consulta */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn-icon-secondary"
            style={{ color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4' }}
            onClick={() => handleOpenWhatsApp('retorno')}
            title="Enviar mensagem no WhatsApp para agendamento"
          >
            <MessageCircle size={15} /> WhatsApp Retorno
          </button>

          <button
            className="btn-primary"
            style={{ width: 'auto', padding: '0 18px', height: '40px', fontSize: '13px' }}
            onClick={() => setIsNewConsultaOpen(true)}
          >
            <Plus size={16} /> Nova Consulta
          </button>

          <button
            className="btn-icon-secondary"
            style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
            onClick={() => setIsConfirmDeleteOpen(true)}
            title="Excluir paciente"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Abas Internas do Perfil: Anamnese, Consultas e Plano Alimentar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <button
          className={`chip-select-btn ${profileTab === 'anamnese' ? 'selected' : ''}`}
          onClick={() => setProfileTab('anamnese')}
        >
          <User size={15} /> Anamnese & Hábitos
        </button>

        <button
          className={`chip-select-btn ${profileTab === 'plano' ? 'selected' : ''}`}
          onClick={() => setProfileTab('plano')}
        >
          <Utensils size={15} /> Plano Alimentar (Dieta)
        </button>

        <button
          className={`chip-select-btn ${profileTab === 'consultas' ? 'selected' : ''}`}
          onClick={() => setProfileTab('consultas')}
        >
          <CalendarCheck size={15} /> Histórico de Consultas ({consultas.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: ANAMNESE COMPLETA & HÁBITOS */}
      {/* ========================================================================= */}
      {profileTab === 'anamnese' && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          {/* Grid de Informações Principais */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '28px' }}>
            {/* Card 1: Dados Pessoais & Contato */}
            <div className="dash-card-full" style={{ padding: '24px', margin: 0 }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} style={{ color: 'var(--primary)' }} /> Dados Pessoais & Contato
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f4f4f5', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Telefone / Celular:</span>
                  <strong>{paciente.telefone || 'Não informado'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f4f4f5', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>WhatsApp:</span>
                  <strong>{paciente.whatsapp || paciente.telefone || 'Não informado'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f4f4f5', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>E-mail:</span>
                  <strong>{paciente.email || 'Não informado'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f4f4f5', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Data de Nascimento:</span>
                  <strong>
                    {paciente.data_nascimento
                      ? new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')
                      : 'Não informada'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Card 2: Perfil Físico & Antropométrico */}
            <div className="dash-card-full" style={{ padding: '24px', margin: 0 }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} style={{ color: 'var(--primary)' }} /> Perfil Clínico & Antropometria
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
                  <div className="patient-info-val" style={{ fontSize: '14px', fontWeight: '800' }}>
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
                  <span style={{ color: 'var(--text-muted)' }}>Nível de Atividade: </span>
                  <strong>{paciente.nivel_atividade || 'Não informado'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Card de Anamnese e Hábitos */}
          <div className="dash-card-full" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} style={{ color: 'var(--primary)' }} /> Anamnese, Patologias e Rotina
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
                <div className="patient-info-lbl">Ingestão Hídrica & Sono</div>
                <div className="patient-info-val">
                  {paciente.litros_agua ? `${paciente.litros_agua}L água/dia` : 'Água não informada'} • Acorda {paciente.horario_acorda || '-'} • Dorme {paciente.horario_dorme || '-'}
                </div>
              </div>
            </div>

            {(paciente.medicamentos || paciente.suplementos || paciente.observacoes) && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', background: '#fafafa', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                {paciente.medicamentos && <div><strong>Medicamentos:</strong> {paciente.medicamentos}</div>}
                {paciente.suplementos && <div><strong>Suplementos:</strong> {paciente.suplementos}</div>}
                {paciente.observacoes && <div><strong>Observações:</strong> {paciente.observacoes}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: PLANO ALIMENTAR PERSONALIZADO */}
      {/* ========================================================================= */}
      {profileTab === 'plano' && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="dash-card-full" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Utensils size={20} style={{ color: 'var(--primary)' }} /> Prescrição Dietética & Plano Alimentar
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Cardápio quantitativo e qualitativo salvo em tempo real no Neon.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-icon-secondary"
                  style={{ color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4' }}
                  onClick={() => handleOpenWhatsApp('dieta')}
                >
                  <Share2 size={15} /> Compartilhar no WhatsApp
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: 'auto', padding: '0 20px', height: '40px', fontSize: '13px' }}
                  onClick={handleSavePlanoSubmit}
                  disabled={savingPlano}
                >
                  <Save size={15} />
                  <span>{savingPlano ? 'Salvando...' : planoSavedSuccess ? 'Plano Salvo!' : 'Salvar Dieta'}</span>
                </button>
              </div>
            </div>

            {/* Metas de Calorias e Macros */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              <div className="patient-info-box" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
                <div className="patient-info-lbl" style={{ color: '#991b1b' }}>Calorias Totais</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    value={planoAlimentar.caloriasTotais}
                    onChange={(e) => setPlanoAlimentar({ ...planoAlimentar, caloriasTotais: e.target.value })}
                    className="form-input"
                    style={{ height: '34px', fontSize: '15px', fontWeight: '800', width: '100px' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '700' }}>kcal</span>
                </div>
              </div>

              <div className="patient-info-box">
                <div className="patient-info-lbl">Proteínas</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    value={planoAlimentar.proteinas}
                    onChange={(e) => setPlanoAlimentar({ ...planoAlimentar, proteinas: e.target.value })}
                    className="form-input"
                    style={{ height: '34px', fontSize: '14px', fontWeight: '700', width: '80px' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '700' }}>g</span>
                </div>
              </div>

              <div className="patient-info-box">
                <div className="patient-info-lbl">Carboidratos</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    value={planoAlimentar.carboidratos}
                    onChange={(e) => setPlanoAlimentar({ ...planoAlimentar, carboidratos: e.target.value })}
                    className="form-input"
                    style={{ height: '34px', fontSize: '14px', fontWeight: '700', width: '80px' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '700' }}>g</span>
                </div>
              </div>

              <div className="patient-info-box">
                <div className="patient-info-lbl">Gorduras</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    value={planoAlimentar.gorduras}
                    onChange={(e) => setPlanoAlimentar({ ...planoAlimentar, gorduras: e.target.value })}
                    className="form-input"
                    style={{ height: '34px', fontSize: '14px', fontWeight: '700', width: '80px' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '700' }}>g</span>
                </div>
              </div>
            </div>

            {/* Lista de Refeições Editáveis */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {planoAlimentar.refeicoes.map((ref, idx) => (
                <div
                  key={ref.id || idx}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px',
                    background: '#ffffff',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: '#09090b', color: 'white', fontSize: '12px', fontWeight: '800', padding: '4px 10px', borderRadius: '12px' }}>
                        {idx + 1}ª Refeição
                      </span>
                      <strong style={{ fontSize: '15px' }}>{ref.nome}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        value={ref.horario}
                        onChange={(e) => {
                          const updated = [...planoAlimentar.refeicoes];
                          updated[idx].horario = e.target.value;
                          setPlanoAlimentar({ ...planoAlimentar, refeicoes: updated });
                        }}
                        className="form-input"
                        style={{ height: '32px', width: '80px', fontSize: '12px', padding: '0 8px' }}
                      />
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={ref.alimentos}
                    onChange={(e) => {
                      const updated = [...planoAlimentar.refeicoes];
                      updated[idx].alimentos = e.target.value;
                      setPlanoAlimentar({ ...planoAlimentar, refeicoes: updated });
                    }}
                    className="form-input"
                    style={{ height: 'auto', fontSize: '13px', resize: 'vertical' }}
                    placeholder="Descrição dos alimentos, porções e substituições..."
                  />
                </div>
              ))}
            </div>

            {/* Orientações Gerais */}
            <div className="form-group">
              <label className="form-label">Orientações Gerais & Hidratação</label>
              <textarea
                rows={3}
                value={planoAlimentar.orientacoesGerais}
                onChange={(e) => setPlanoAlimentar({ ...planoAlimentar, orientacoesGerais: e.target.value })}
                className="form-input"
                style={{ height: 'auto', resize: 'vertical' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: HISTÓRICO DE CONSULTAS */}
      {/* ========================================================================= */}
      {profileTab === 'consultas' && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="dash-card-full" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarCheck size={18} style={{ color: 'var(--primary)' }} /> Histórico de Consultas ({consultas.length})
              </h3>
              <button
                className="btn-primary"
                style={{ width: 'auto', fontSize: '12px', padding: '0 16px', height: '36px' }}
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
                {consultas.map((c, idx) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 20px',
                      background: '#ffffff',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <strong style={{ fontSize: '15px' }}>
                          Consulta em {new Date(c.data_consulta).toLocaleDateString('pt-BR')}
                        </strong>
                        {idx === 0 && (
                          <span style={{ fontSize: '11px', background: '#fef2f2', color: '#991b1b', fontWeight: '800', padding: '2px 8px', borderRadius: '10px' }}>
                            Mais Recente
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {c.peso && <span><strong>Peso:</strong> {c.peso} kg • </span>}
                        {c.cintura && <span><strong>Cintura:</strong> {c.cintura} cm • </span>}
                        {c.quadril && <span><strong>Quadril:</strong> {c.quadril} cm • </span>}
                        {c.percentual_gordura && <span><strong>% Gordura:</strong> {c.percentual_gordura}% • </span>}
                        {c.observacoes && <span>{c.observacoes}</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {c.proximo_retorno ? (
                        <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', background: 'var(--primary-light)', padding: '6px 12px', borderRadius: '12px' }}>
                          Retorno: {new Date(c.proximo_retorno).toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#b45309', background: '#fef3c7', padding: '6px 12px', borderRadius: '12px' }}>
                          Sem retorno
                        </span>
                      )}

                      <button
                        className="btn-icon-secondary"
                        style={{ padding: '6px 10px', color: 'var(--danger)' }}
                        onClick={() => handleDeleteConsultaClick(c.id)}
                        title="Excluir consulta"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Nova Consulta */}
      {isNewConsultaOpen && (
        <div className="modal-overlay" onClick={() => setIsNewConsultaOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <CalendarCheck size={20} style={{ color: 'var(--primary)' }} />
                <span>Registrar Nova Consulta</span>
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

      {/* Modal: Confirmar Exclusão do Paciente */}
      {isConfirmDeleteOpen && (
        <div className="modal-overlay" onClick={() => setIsConfirmDeleteOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title" style={{ color: 'var(--danger)' }}>
                <AlertTriangle size={22} />
                <span>Excluir Paciente</span>
              </div>
              <button className="btn-close" onClick={() => setIsConfirmDeleteOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Tem certeza que deseja excluir o cadastro de <strong>{paciente.nome}</strong>? Todas as consultas e planos alimentares vinculados serão permanentemente removidos do banco de dados Neon.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn-icon-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setIsConfirmDeleteOpen(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1, background: '#dc2626' }}
                onClick={handleDeletePatient}
                disabled={deleting}
              >
                {deleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
