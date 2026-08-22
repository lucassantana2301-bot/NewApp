import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  User, 
  ArrowLeft, 
  Activity, 
  Clock, 
  Plus, 
  Weight, 
  Utensils, 
  CalendarCheck,
  CheckCircle2,
  X,
  MessageCircle,
  Trash2,
  Save,
  Sparkles,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Check,
  Eye
} from 'lucide-react';
import { 
  fetchPacienteDetalhes, 
  updatePaciente,
  createConsulta, 
  deleteConsulta,
  deletePaciente
} from '../lib/neonClient';

// Opções pré-definidas para edição dos dados clínicos
const OBJETIVOS_OPCOES = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar'
];

const NIVEIS_ATIVIDADE = [
  'Sedentário',
  'Levemente ativo',
  'Moderadamente ativo',
  'Muito ativo',
  'Extremamente ativo'
];

const PATOLOGIAS_OPCOES = [
  'Nenhum',
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto'
];

const RESTRICOES_OPCOES = [
  'Nenhum',
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar'
];

const ALERGIAS_OPCOES = [
  'Nenhum',
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar'
];

function formatPhone(value) {
  if (!value) return '';
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  }
  return clean.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
}

function formatTimeInput(val) {
  if (!val) return '';
  const digits = val.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length === 1 || digits.length === 2) {
    const num = parseInt(digits, 10);
    if (num >= 0 && num <= 23) {
      return digits.padStart(2, '0') + ':00';
    }
  }
  if (digits.length === 3) {
    const h = digits.slice(0, 1).padStart(2, '0');
    const m = digits.slice(1);
    return `${h}:${m}`;
  }
  if (digits.length >= 4) {
    const h = digits.slice(0, 2);
    const m = digits.slice(2, 4);
    return `${h}:${m}`;
  }
  return val;
}

export default function PatientProfileScreen({ patientId, user, onBack, onDeleted }) {
  // Abas principais: 'evolucao' (Consultas e Evolução - padrão) | 'dados' (Dados do Paciente) | 'planos' (Planos Alimentares)
  const [activeTab, setActiveTab] = useState('evolucao');
  
  // Sub-categoria da aba Dados do Paciente: 1: Pessoal, 2: Clínico, 3: Hábitos
  const [dadosSubTab, setDadosSubTab] = useState(1);

  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [planos, setPlanos] = useState([]);

  // Toast Feedback
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Formulário de Edição dos Dados do Paciente
  const [editForm, setEditForm] = useState({
    nome: '',
    data_nascimento: '',
    data_inicio_tratamento: '',
    sexo: 'Feminino',
    telefone: '',
    whatsapp: '',
    email: '',
    peso_inicial: '',
    altura: '',
    objetivos: [],
    objetivo_texto: '',
    nivel_atividade: 'Levemente ativo',
    patologias: [],
    patologia_custom: '',
    restricoes_alimentares: [],
    restricao_custom: '',
    alergias: [],
    alergia_custom: '',
    medicamentos: '',
    suplementos: '',
    refeicoes_por_dia: '',
    horario_acorda: '',
    horario_dorme: '',
    litros_agua: '',
    atividade_fisica: false,
    atividade_fisica_descricao: '',
    observacoes: ''
  });

  const [savingPaciente, setSavingPaciente] = useState(false);
  const [pacienteSaveError, setPacienteSaveError] = useState('');

  // Modal: Nova Consulta
  const [isNewConsultaOpen, setIsNewConsultaOpen] = useState(false);
  const [savingConsulta, setSavingConsulta] = useState(false);
  const [consultaError, setConsultaError] = useState('');
  const [consultaForm, setConsultaForm] = useState({
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    proximo_retorno: '',
    observacoes: ''
  });

  // Modal: Visualizar Plano Alimentar
  const [selectedPlano, setSelectedPlano] = useState(null);
  const [isPlanoModalOpen, setIsPlanoModalOpen] = useState(false);

  // Modal: Confirmar Exclusão do Paciente
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState(false);

  // Modal Informativo: Gerar Plano Alimentar (Prompt 6 preview)
  const [isGerarPlanoModalOpen, setIsGerarPlanoModalOpen] = useState(false);

  // Hover state para o gráfico de evolução
  const [chartHoverPoint, setChartHoverPoint] = useState(null);

  // Carregar dados completos do Neon
  const loadData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const details = await fetchPacienteDetalhes(patientId, user.id);
      setPatientData(details.paciente);
      setConsultas(details.consultas || []);
      setPlanos(details.planos || []);

      // Preenche o formulário de edição com os dados existentes
      const p = details.paciente;
      if (p) {
        const alturaCm = p.altura ? (Number(p.altura) > 3 ? p.altura : Math.round(Number(p.altura) * 100)) : '';
        setEditForm({
          nome: p.nome || '',
          data_nascimento: p.data_nascimento ? p.data_nascimento.split('T')[0] : '',
          data_inicio_tratamento: p.data_inicio_tratamento ? p.data_inicio_tratamento.split('T')[0] : (p.created_at ? p.created_at.split('T')[0] : ''),
          sexo: p.sexo || 'Feminino',
          telefone: p.telefone || '',
          whatsapp: p.whatsapp || '',
          email: p.email || '',
          peso_inicial: p.peso_inicial ? String(p.peso_inicial) : '',
          altura: alturaCm ? String(alturaCm) : '',
          objetivos: Array.isArray(p.objetivos) ? p.objetivos : [],
          objetivo_texto: p.objetivo_texto || '',
          nivel_atividade: p.nivel_atividade || 'Levemente ativo',
          patologias: Array.isArray(p.patologias) ? p.patologias : [],
          patologia_custom: '',
          restricoes_alimentares: Array.isArray(p.restricoes_alimentares) ? p.restricoes_alimentares : [],
          restricao_custom: '',
          alergias: Array.isArray(p.alergias) ? p.alergias : [],
          alergia_custom: '',
          medicamentos: p.medicamentos || '',
          suplementos: p.suplementos || '',
          refeicoes_por_dia: p.refeicoes_por_dia ? String(p.refeicoes_por_dia) : '',
          horario_acorda: p.horario_acorda || '',
          horario_dorme: p.horario_dorme || '',
          litros_agua: p.litros_agua ? String(p.litros_agua) : '',
          atividade_fisica: Boolean(p.atividade_fisica),
          atividade_fisica_descricao: p.atividade_fisica_descricao || '',
          observacoes: p.observacoes || ''
        });
      }
    } catch (err) {
      console.error('Erro ao buscar dados do paciente no Neon:', err);
      showToast('Não foi possível carregar as informações do paciente.', 'error');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      loadData(true);
    }
  }, [patientId]);

  // Cálculos dinâmicos
  const calculatedAge = useMemo(() => {
    if (!editForm.data_nascimento) return null;
    const birthDate = new Date(editForm.data_nascimento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return isNaN(age) || age < 0 ? null : age;
  }, [editForm.data_nascimento]);

  const imcInfo = useMemo(() => {
    const peso = parseFloat(editForm.peso_inicial);
    const alturaCm = parseFloat(editForm.altura);

    if (!peso || !alturaCm || alturaCm <= 0) return null;

    const alturaM = alturaCm > 3 ? alturaCm / 100 : alturaCm;
    const imc = peso / (alturaM * alturaM);
    const imcFormatted = imc.toFixed(1);

    let classificacao = 'Normal';
    let cor = '#059669';

    if (imc < 18.5) {
      classificacao = 'Baixo peso';
      cor = '#0284c7';
    } else if (imc >= 18.5 && imc < 24.9) {
      classificacao = 'Peso normal';
      cor = '#059669';
    } else if (imc >= 25 && imc < 29.9) {
      classificacao = 'Sobrepeso';
      cor = '#d97706';
    } else if (imc >= 30 && imc < 34.9) {
      classificacao = 'Obesidade Grau I';
      cor = '#ea580c';
    } else {
      classificacao = 'Obesidade Grau II/III';
      cor = '#dc2626';
    }

    return { valor: imcFormatted, classificacao, cor };
  }, [editForm.peso_inicial, editForm.altura]);

  // -------------------------------------------------------------
  // DADOS CRONOLÓGICOS PARA O GRÁFICO DE EVOLUÇÃO
  // -------------------------------------------------------------
  const chartData = useMemo(() => {
    // 1. Coleta todas as consultas que têm peso
    const validConsultas = consultas
      .filter((c) => c.peso && Number(c.peso) > 0)
      .map((c) => ({
        id: c.id,
        data: c.data_consulta ? c.data_consulta.split('T')[0] : '',
        peso: Number(c.peso),
        observacoes: c.observacoes || ''
      }));

    // 2. Se não houver consulta mas houver peso inicial e data de início, monta ponto inicial
    if (validConsultas.length === 0 && patientData?.peso_inicial) {
      const dInicio = patientData.data_inicio_tratamento ? patientData.data_inicio_tratamento.split('T')[0] : (patientData.created_at ? patientData.created_at.split('T')[0] : '');
      if (dInicio) {
        validConsultas.push({
          id: 'initial',
          data: dInicio,
          peso: Number(patientData.peso_inicial),
          observacoes: 'Início do tratamento'
        });
      }
    }

    // 3. Ordenação cronológica (mais antigo para o mais recente)
    validConsultas.sort((a, b) => new Date(a.data) - new Date(b.data));

    return validConsultas;
  }, [consultas, patientData]);

  // Estatísticas de peso
  const weightStats = useMemo(() => {
    if (chartData.length === 0) return null;
    const initialWeight = chartData[0].peso;
    const currentWeight = chartData[chartData.length - 1].peso;
    const diff = currentWeight - initialWeight;
    const minWeight = Math.min(...chartData.map((d) => d.peso));
    const maxWeight = Math.max(...chartData.map((d) => d.peso));

    return {
      initialWeight,
      currentWeight,
      diff: Number(diff.toFixed(1)),
      minWeight,
      maxWeight,
      totalPoints: chartData.length
    };
  }, [chartData]);

  // -------------------------------------------------------------
  // HANDLERS: DADOS DO PACIENTE (SALVAR NO NEON)
  // -------------------------------------------------------------
  const handleToggleMulti = (field, item) => {
    setEditForm((prev) => {
      const currentList = prev[field] || [];
      if (item === 'Nenhum') {
        return {
          ...prev,
          [field]: currentList.includes('Nenhum') ? [] : ['Nenhum']
        };
      }
      let updated = currentList.filter((i) => i !== 'Nenhum');
      if (updated.includes(item)) {
        updated = updated.filter((i) => i !== item);
      } else {
        updated.push(item);
      }
      return { ...prev, [field]: updated };
    });
  };

  const handleAddCustomTag = (field, customInputKey) => {
    const tag = editForm[customInputKey]?.trim();
    if (!tag) return;
    setEditForm((prev) => {
      const currentList = (prev[field] || []).filter((i) => i !== 'Nenhum');
      if (!currentList.includes(tag)) {
        currentList.push(tag);
      }
      return {
        ...prev,
        [field]: currentList,
        [customInputKey]: ''
      };
    });
  };

  const handleSavePacienteSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!editForm.nome.trim()) {
      setPacienteSaveError('O campo Nome Completo é obrigatório.');
      setDadosSubTab(1);
      return;
    }

    if (!editForm.data_inicio_tratamento) {
      setPacienteSaveError('O campo Data de início do tratamento é obrigatório.');
      setDadosSubTab(1);
      return;
    }

    setPacienteSaveError('');
    setSavingPaciente(true);

    try {
      const alturaMetros = editForm.altura ? Number(editForm.altura) / 100 : null;
      const payload = {
        ...editForm,
        altura: alturaMetros,
        peso_inicial: editForm.peso_inicial ? Number(editForm.peso_inicial) : null
      };

      const updated = await updatePaciente(patientId, payload, user.id);
      setPatientData(updated);
      showToast('Alterações salvas com sucesso!');
      await loadData(false);
    } catch (err) {
      console.error('Erro ao atualizar paciente:', err);
      setPacienteSaveError(err.message || 'Erro ao salvar alterações no Neon.');
      showToast('Erro ao salvar alterações. Verifique os campos.', 'error');
    } finally {
      setSavingPaciente(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: CONSULTAS (CRIAR E EXCLUIR NO NEON)
  // -------------------------------------------------------------
  const handleCreateConsultaSubmit = async (e) => {
    e.preventDefault();
    if (!consultaForm.data_consulta) {
      setConsultaError('A data da consulta é obrigatória.');
      return;
    }
    if (!consultaForm.peso || Number(consultaForm.peso) <= 0) {
      setConsultaError('O peso atual é obrigatório.');
      return;
    }

    setConsultaError('');
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

      await loadData(false);
      showToast('Consulta registrada com sucesso!');
    } catch (err) {
      console.error('Erro ao registrar consulta:', err);
      setConsultaError(err.message || 'Erro ao salvar consulta no Neon.');
    } finally {
      setSavingConsulta(false);
    }
  };

  const handleDeleteConsultaClick = async (consultaId) => {
    if (!window.confirm('Tem certeza de que deseja excluir o registro desta consulta?')) return;
    try {
      await deleteConsulta(consultaId);
      await loadData(false);
      showToast('Consulta excluída com sucesso.');
    } catch (err) {
      alert('Erro ao excluir consulta: ' + err.message);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: EXCLUSÃO DO PACIENTE
  // -------------------------------------------------------------
  const handleDeletePatientConfirmed = async () => {
    setDeletingPatient(true);
    try {
      await deletePaciente(patientId, user.id);
      if (onDeleted) onDeleted();
      else onBack();
    } catch (err) {
      alert('Erro ao excluir paciente: ' + err.message);
      setDeletingPatient(false);
    }
  };

  // WhatsApp Rápido
  const handleOpenWhatsApp = (tipo = 'retorno') => {
    const raw = patientData?.whatsapp || patientData?.telefone || '';
    const clean = raw.replace(/\D/g, '');
    if (!clean) {
      alert('Este paciente não possui telefone/WhatsApp cadastrado.');
      return;
    }
    const nome = patientData?.nome?.split(' ')[0] || 'Paciente';
    let msg = `Olá ${nome}! Aqui é do consultório de nutrição. Gostaria de agendar o seu retorno nutricional para avaliarmos a sua evolução?`;
    window.open(`https://wa.me/55${clean}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Estado de Carregamento
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', animation: 'fadeIn 0.2s ease' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px auto', borderTopColor: 'var(--primary)', borderColor: 'var(--primary-border)' }}></div>
        <p style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-main)' }}>Carregando dados do paciente no Neon...</p>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="empty-state-box" style={{ margin: '40px 0' }}>
        <AlertCircle size={32} style={{ color: 'var(--danger)', margin: '0 auto 12px auto' }} />
        <p style={{ fontWeight: '800', fontSize: '16px' }}>Paciente não encontrado.</p>
        <button className="btn-primary" style={{ width: 'auto', margin: '16px auto 0 auto' }} onClick={onBack}>
          <ArrowLeft size={16} /> Voltar para Pacientes
        </button>
      </div>
    );
  }

  const patientInitials = (patientData.nome || 'P')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const dataInicioDisplay = patientData.data_inicio_tratamento 
    ? new Date(patientData.data_inicio_tratamento).toLocaleDateString('pt-BR') 
    : (patientData.created_at ? new Date(patientData.created_at).toLocaleDateString('pt-BR') : 'Não informada');

  return (
    <div style={{ animation: 'fadeIn 0.25s ease' }}>
      {/* Toast Feedback */}
      {toastMessage && (
        <div className={toastType === 'error' ? 'toast-error' : 'toast-success'}>
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. CABEÇALHO DO PACIENTE COM AVATAR, STATUS E AÇÕES */}
      {/* ========================================================================= */}
      <div className="dash-card-full" style={{ padding: '24px', marginBottom: '24px', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          {/* Lado Esquerdo: Botão Voltar + Avatar + Detalhes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onBack}
              className="btn-icon-secondary"
              style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, justifyContent: 'center' }}
              title="Voltar para a listagem de pacientes"
            >
              <ArrowLeft size={18} />
            </button>

            {/* Avatar Stylized */}
            <div 
              style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', 
                color: '#ffffff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: '900',
                boxShadow: '0 8px 20px rgba(220, 38, 38, 0.25)',
                border: '3px solid #ffffff'
              }}
            >
              {patientInitials}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                  {patientData.nome}
                </h1>
                <span 
                  style={{ 
                    fontSize: '11px', 
                    fontWeight: '800', 
                    background: '#f0fdf4', 
                    color: '#166534', 
                    border: '1px solid #bbf7d0', 
                    padding: '3px 10px', 
                    borderRadius: '20px' 
                  }}
                >
                  ● Ativo / Em Acompanhamento
                </span>
              </div>

              {/* Informações Resumidas */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '13px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                <span><strong>Sexo:</strong> {patientData.sexo || 'Não informado'}</span>
                {calculatedAge !== null && <span>• <strong>Idade:</strong> {calculatedAge} anos</span>}
                <span>• <strong>Início:</strong> {dataInicioDisplay}</span>
                {patientData.telefone && <span>• <strong>Tel:</strong> {patientData.telefone}</span>}
                {imcInfo && <span>• <strong>IMC:</strong> {imcInfo.valor} ({imcInfo.classificacao})</span>}
              </div>
            </div>
          </div>

          {/* Lado Direito: Ações Rápidas */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn-icon-secondary"
              style={{ color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4', height: '40px', padding: '0 14px' }}
              onClick={() => handleOpenWhatsApp('retorno')}
              title="Abrir conversa no WhatsApp"
            >
              <MessageCircle size={15} /> WhatsApp
            </button>

            <button
              className="btn-primary"
              style={{ width: 'auto', padding: '0 18px', height: '40px', fontSize: '13px' }}
              onClick={() => {
                setActiveTab('evolucao');
                setIsNewConsultaOpen(true);
              }}
            >
              <Plus size={16} /> Nova Consulta
            </button>

            <button
              className="btn-icon-secondary"
              style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)', height: '40px', width: '40px', padding: 0, justifyContent: 'center' }}
              onClick={() => setIsConfirmDeleteOpen(true)}
              title="Excluir paciente"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. NAVEGAÇÃO ENTRE AS 3 GRANDES SEÇÕES */}
      {/* ========================================================================= */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        {/* Seção 2: Consultas e Evolução (Destaque Principal) */}
        <button
          className={`chip-select-btn ${activeTab === 'evolucao' ? 'selected' : ''}`}
          onClick={() => setActiveTab('evolucao')}
          style={{ fontSize: '14px', padding: '10px 20px' }}
        >
          <Activity size={16} /> Consultas e Evolução ({consultas.length})
        </button>

        {/* Seção 1: Dados do Paciente */}
        <button
          className={`chip-select-btn ${activeTab === 'dados' ? 'selected' : ''}`}
          onClick={() => setActiveTab('dados')}
          style={{ fontSize: '14px', padding: '10px 20px' }}
        >
          <User size={16} /> Dados do Paciente
        </button>

        {/* Seção 3: Planos Alimentares */}
        <button
          className={`chip-select-btn ${activeTab === 'planos' ? 'selected' : ''}`}
          onClick={() => setActiveTab('planos')}
          style={{ fontSize: '14px', padding: '10px 20px' }}
        >
          <Utensils size={16} /> Planos Alimentares ({planos.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 2: CONSULTAS E EVOLUÇÃO (Destaque Principal) */}
      {/* ========================================================================= */}
      {activeTab === 'evolucao' && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          {/* Header da Seção de Evolução com Botão Nova Consulta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} style={{ color: 'var(--primary)' }} /> Evolução do Paciente ao Longo do Tratamento
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Gráfico interativo de peso sincronizado com o histórico de consultas no Neon.
              </p>
            </div>

            <button
              className="btn-primary"
              style={{ width: 'auto', padding: '0 20px', height: '42px', fontSize: '13px' }}
              onClick={() => setIsNewConsultaOpen(true)}
            >
              <Plus size={16} /> Nova Consulta
            </button>
          </div>

          {/* Cards de Métricas de Peso */}
          {weightStats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              <div className="dash-card-stat" style={{ padding: '16px 20px' }}>
                <div>
                  <div className="dash-stat-title">Peso Inicial</div>
                  <div className="dash-stat-number" style={{ fontSize: '22px' }}>{weightStats.initialWeight} kg</div>
                  <div className="dash-stat-desc">Início: {dataInicioDisplay}</div>
                </div>
              </div>

              <div className="dash-card-stat" style={{ padding: '16px 20px' }}>
                <div>
                  <div className="dash-stat-title">Peso Atual</div>
                  <div className="dash-stat-number" style={{ fontSize: '22px', color: 'var(--primary)' }}>
                    {weightStats.currentWeight} kg
                  </div>
                  <div className="dash-stat-desc">Última medição</div>
                </div>
              </div>

              <div className="dash-card-stat" style={{ padding: '16px 20px' }}>
                <div>
                  <div className="dash-stat-title">Variação Total</div>
                  <div 
                    className="dash-stat-number" 
                    style={{ 
                      fontSize: '22px', 
                      color: weightStats.diff <= 0 ? '#16a34a' : '#ea580c',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {weightStats.diff <= 0 ? <TrendingDown size={22} /> : <TrendingUp size={22} />}
                    {weightStats.diff > 0 ? `+${weightStats.diff}` : weightStats.diff} kg
                  </div>
                  <div className="dash-stat-desc">
                    {weightStats.diff <= 0 ? 'Redução de peso' : 'Ganho de peso'}
                  </div>
                </div>
              </div>

              <div className="dash-card-stat" style={{ padding: '16px 20px' }}>
                <div>
                  <div className="dash-stat-title">Total de Registros</div>
                  <div className="dash-stat-number" style={{ fontSize: '22px' }}>{weightStats.totalPoints}</div>
                  <div className="dash-stat-desc">Consultas computadas</div>
                </div>
              </div>
            </div>
          )}

          {/* 3.1 GRÁFICO DE EVOLUÇÃO DE PESO (SVG Moderno & Responsivo) */}
          <div className="dash-card-full" style={{ padding: '24px', marginBottom: '28px', background: '#ffffff', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Weight size={18} style={{ color: 'var(--primary)' }} /> Curva de Evolução de Peso (kg)
              </div>
              {weightStats && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  Mín: {weightStats.minWeight}kg • Máx: {weightStats.maxWeight}kg
                </span>
              )}
            </div>

            {/* Container do Gráfico */}
            <div style={{ width: '100%', height: '280px', position: 'relative', background: '#fafafa', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {chartData.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <Weight size={36} style={{ color: 'var(--text-light)', marginBottom: '8px', opacity: 0.7 }} />
                  <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-muted)' }}>
                    Nenhuma consulta registrada ainda
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px', maxWidth: '320px' }}>
                    Clique no botão "+ Nova Consulta" acima para registrar a primeira pesagem do paciente.
                  </p>
                </div>
              ) : (
                (() => {
                  const width = 800;
                  const height = 240;
                  const padding = { top: 30, right: 40, bottom: 40, left: 50 };

                  const weights = chartData.map((d) => d.peso);
                  const minW = Math.min(...weights) - 2;
                  const maxW = Math.max(...weights) + 2;
                  const rangeW = maxW - minW || 1;

                  const chartW = width - padding.left - padding.right;
                  const chartH = height - padding.top - padding.bottom;

                  const points = chartData.map((d, i) => {
                    const x = chartData.length === 1 
                      ? padding.left + chartW / 2 
                      : padding.left + (i / (chartData.length - 1)) * chartW;
                    const y = padding.top + chartH - ((d.peso - minW) / rangeW) * chartH;
                    return { ...d, x, y };
                  });

                  // Construção da linha SVG
                  const pathD = points.length === 1
                    ? `M ${points[0].x - 30} ${points[0].y} L ${points[0].x + 30} ${points[0].y}`
                    : points.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

                  // Área gradiente sob a linha
                  const areaD = points.length > 1 
                    ? `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`
                    : '';

                  return (
                    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      <defs>
                        {/* Glow Filter Laser */}
                        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="4" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#dc2626" />
                          <stop offset="50%" stopColor="#ff2b2b" />
                          <stop offset="100%" stopColor="#dc2626" />
                        </linearGradient>
                        <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#dc2626" stopOpacity="0.32" />
                          <stop offset="100%" stopColor="#dc2626" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Linhas de Grade Horizontais (Eixo Y) */}
                      {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                        const yVal = padding.top + chartH * pct;
                        const weightVal = (maxW - pct * rangeW).toFixed(1);
                        return (
                          <g key={idx}>
                            <line 
                              x1={padding.left} 
                              y1={yVal} 
                              x2={width - padding.right} 
                              y2={yVal} 
                              stroke="rgba(220, 38, 38, 0.12)" 
                              strokeDasharray="4 4" 
                            />
                            <text 
                              x={padding.left - 12} 
                              y={yVal + 4} 
                              textAnchor="end" 
                              fontSize="11" 
                              fill="#64748b" 
                              fontWeight="800"
                              fontFamily="'JetBrains Mono', monospace"
                            >
                              {weightVal} kg
                            </text>
                          </g>
                        );
                      })}

                      {/* Área Sob a Curva */}
                      {areaD && <path d={areaD} fill="url(#areaGrad)" />}

                      {/* Linha Principal da Curva com Filtro Neon */}
                      <path 
                        d={pathD} 
                        fill="none" 
                        stroke="url(#lineGrad)" 
                        strokeWidth="4" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        filter="url(#neonGlow)"
                      />

                      {/* Pontos Interativos com Efeito Sonar e Tooltip */}
                      {points.map((p, idx) => {
                        const isHovered = chartHoverPoint?.id === p.id;
                        const dateFormatted = new Date(p.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

                        return (
                          <g key={p.id || idx}>
                            {/* Rótulo de Data no Eixo X */}
                            <text 
                              x={p.x} 
                              y={height - padding.bottom + 22} 
                              textAnchor="middle" 
                              fontSize="11" 
                              fill="#64748b" 
                              fontWeight="800"
                              fontFamily="'JetBrains Mono', monospace"
                            >
                              {dateFormatted}
                            </text>

                            {/* Halo / Sonar Pulse Permanente & Hover */}
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r={isHovered ? "16" : "10"} 
                              fill="rgba(220, 38, 38, 0.2)" 
                              stroke="rgba(255, 43, 43, 0.4)"
                              strokeWidth="1"
                            />

                            {/* Círculo do Ponto Neon */}
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r={isHovered ? "7" : "5"} 
                              fill="#ffffff" 
                              stroke="#dc2626" 
                              strokeWidth={isHovered ? "3.5" : "2.5"} 
                              filter="url(#neonGlow)"
                              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                              onMouseEnter={() => setChartHoverPoint(p)}
                              onMouseLeave={() => setChartHoverPoint(null)}
                            />
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()
              )}

              {/* Tooltip Dinâmico ao passar o mouse */}
              {chartHoverPoint && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(9, 9, 11, 0.92)',
                    backdropFilter: 'blur(8px)',
                    color: '#ffffff',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-black)',
                    fontSize: '12px',
                    pointerEvents: 'none',
                    zIndex: 10,
                    animation: 'fadeIn 0.15s ease'
                  }}
                >
                  <div style={{ color: '#a1a1aa', fontSize: '11px' }}>
                    Data: <strong>{new Date(chartHoverPoint.data).toLocaleDateString('pt-BR')}</strong>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#fca5a5', marginTop: '2px' }}>
                    Peso: {chartHoverPoint.peso} kg
                  </div>
                  {chartHoverPoint.observacoes && (
                    <div style={{ color: '#e4e4e7', fontSize: '11px', marginTop: '4px', maxWidth: '200px' }}>
                      {chartHoverPoint.observacoes}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. HISTÓRICO COMPLETO DE CONSULTAS (Decrescente) */}
          {/* ========================================================================= */}
          <div className="dash-card-full" style={{ padding: '24px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarCheck size={20} style={{ color: 'var(--primary)' }} /> Histórico de Consultas Realizadas ({consultas.length})
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Apresentadas em ordem cronológica decrescente (da mais recente para a mais antiga).
                </p>
              </div>
            </div>

            {consultas.length === 0 ? (
              <div className="empty-state-box" style={{ padding: '36px 20px' }}>
                <CalendarCheck size={32} style={{ color: 'var(--text-light)', margin: '0 auto 8px auto' }} />
                <div style={{ fontWeight: '800', fontSize: '15px' }}>Nenhuma consulta registrada ainda</div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Clique no botão "+ Nova Consulta" para registrar a evolução física deste paciente.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {consultas.map((c, idx) => (
                  <div
                    key={c.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '18px 22px',
                      background: idx === 0 ? '#fffefe' : '#ffffff',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                      borderLeft: idx === 0 ? '4px solid var(--primary)' : '1px solid var(--border)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '16px', color: 'var(--text-main)' }}>
                          Consulta em {new Date(c.data_consulta).toLocaleDateString('pt-BR')}
                        </strong>
                        {idx === 0 && (
                          <span style={{ fontSize: '11px', background: '#fef2f2', color: '#991b1b', fontWeight: '800', padding: '2px 8px', borderRadius: '10px', border: '1px solid var(--primary-border)' }}>
                            Mais Recente
                          </span>
                        )}
                      </div>

                      {/* Dados da Consulta */}
                      <div style={{ display: 'flex', gap: '18px', marginTop: '8px', fontSize: '13px', color: 'var(--text-main)', flexWrap: 'wrap' }}>
                        <span><strong>Peso:</strong> {c.peso ? `${c.peso} kg` : '—'}</span>
                        <span><strong>Cintura:</strong> {c.cintura ? `${c.cintura} cm` : '—'}</span>
                        <span><strong>Quadril:</strong> {c.quadril ? `${c.quadril} cm` : '—'}</span>
                        <span><strong>% Gordura:</strong> {c.percentual_gordura ? `${c.percentual_gordura}%` : '—'}</span>
                      </div>

                      {/* Observações */}
                      {c.observacoes && (
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic', background: '#fafafa', padding: '6px 12px', borderRadius: '6px' }}>
                          "{c.observacoes}"
                        </div>
                      )}
                    </div>

                    {/* Próximo Retorno & Ação */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {c.proximo_retorno ? (
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '6px 12px', borderRadius: '12px' }}>
                          Retorno: {new Date(c.proximo_retorno).toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#71717a', background: '#f4f4f5', padding: '6px 12px', borderRadius: '12px' }}>
                          Retorno não agendado
                        </span>
                      )}

                      <button
                        className="btn-icon-secondary"
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)', padding: '6px 10px' }}
                        onClick={() => handleDeleteConsultaClick(c.id)}
                        title="Excluir esta consulta"
                      >
                        <Trash2 size={15} />
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
      {/* SEÇÃO 1: DADOS DO PACIENTE (Visualizar e Editar no Neon) */}
      {/* ========================================================================= */}
      {activeTab === 'dados' && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          <form onSubmit={handleSavePacienteSubmit}>
            {/* Header da Seção de Dados com Botão Salvar Alterações */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={20} style={{ color: 'var(--primary)' }} /> Ficha Cadastral e Anamnese Completa
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Edite qualquer informação do paciente e salve diretamente no banco de dados Neon.
                </p>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: 'auto', padding: '0 24px', height: '42px', fontSize: '14px', fontWeight: '800' }}
                disabled={savingPaciente}
              >
                <Save size={16} />
                <span>{savingPaciente ? 'Salvando no Neon...' : 'Salvar Alterações'}</span>
              </button>
            </div>

            {/* Mensagem de Erro se houver */}
            {pacienteSaveError && (
              <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                <AlertCircle size={18} />
                <span>{pacienteSaveError}</span>
              </div>
            )}

            {/* Abas das 3 Categorias: Pessoal, Clínico, Hábitos */}
            <div className="form-tabs-header" style={{ marginBottom: '24px' }}>
              <button
                type="button"
                className={`form-tab-btn ${dadosSubTab === 1 ? 'active' : ''}`}
                onClick={() => setDadosSubTab(1)}
              >
                <div className="form-tab-number">1</div>
                <div style={{ textAlign: 'left' }}>
                  <div className="form-tab-title">Pessoal</div>
                  <div className="form-tab-desc">Nome, início e contatos</div>
                </div>
              </button>

              <button
                type="button"
                className={`form-tab-btn ${dadosSubTab === 2 ? 'active' : ''}`}
                onClick={() => setDadosSubTab(2)}
              >
                <div className="form-tab-number">2</div>
                <div style={{ textAlign: 'left' }}>
                  <div className="form-tab-title">Clínico</div>
                  <div className="form-tab-desc">Peso, IMC & Anamnese</div>
                </div>
              </button>

              <button
                type="button"
                className={`form-tab-btn ${dadosSubTab === 3 ? 'active' : ''}`}
                onClick={() => setDadosSubTab(3)}
              >
                <div className="form-tab-number">3</div>
                <div style={{ textAlign: 'left' }}>
                  <div className="form-tab-title">Hábitos</div>
                  <div className="form-tab-desc">Rotina, água & sono</div>
                </div>
              </button>
            </div>

            {/* Card Body do Formulário */}
            <div className="form-card-body" style={{ padding: '28px', background: '#ffffff' }}>
              {/* SUB-ABA 1: PESSOAL */}
              {dadosSubTab === 1 && (
                <div style={{ animation: 'fadeIn 0.2s ease' }}>
                  <div className="section-title-tag">
                    <User size={16} /> Dados Pessoais e Início do Tratamento
                  </div>

                  {/* Nome Completo */}
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label className="form-label">
                      Nome completo <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.nome}
                      onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                      className="form-input"
                      style={{ fontSize: '15px', fontWeight: '600' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    {/* Data de Início do Tratamento (Obrigatório) */}
                    <div className="form-group">
                      <label className="form-label">
                        Data de início do tratamento <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={editForm.data_inicio_tratamento}
                        onChange={(e) => setEditForm({ ...editForm, data_inicio_tratamento: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    {/* Data de Nascimento + Cálculo de Idade */}
                    <div className="form-group">
                      <label className="form-label">
                        Data de nascimento
                        {calculatedAge !== null && (
                          <span className="badge-age-calc">
                            {calculatedAge} {calculatedAge === 1 ? 'ano' : 'anos'}
                          </span>
                        )}
                      </label>
                      <input
                        type="date"
                        value={editForm.data_nascimento}
                        onChange={(e) => setEditForm({ ...editForm, data_nascimento: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    {/* Sexo */}
                    <div className="form-group">
                      <label className="form-label">Sexo</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {['Feminino', 'Masculino', 'Outro'].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setEditForm({ ...editForm, sexo: s })}
                            className={`chip-select-btn ${editForm.sexo === s ? 'selected' : ''}`}
                            style={{ flex: 1 }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                    {/* Telefone */}
                    <div className="form-group">
                      <label className="form-label">Telefone</label>
                      <input
                        type="text"
                        placeholder="(11) 3333-4444"
                        value={editForm.telefone}
                        onChange={(e) => setEditForm({ ...editForm, telefone: formatPhone(e.target.value) })}
                        className="form-input"
                      />
                    </div>

                    {/* WhatsApp */}
                    <div className="form-group">
                      <label className="form-label">WhatsApp</label>
                      <input
                        type="text"
                        placeholder="(11) 99999-8888"
                        value={editForm.whatsapp}
                        onChange={(e) => setEditForm({ ...editForm, whatsapp: formatPhone(e.target.value) })}
                        className="form-input"
                      />
                    </div>

                    {/* Email */}
                    <div className="form-group">
                      <label className="form-label">E-mail</label>
                      <input
                        type="email"
                        placeholder="paciente@exemplo.com"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-ABA 2: CLÍNICO */}
              {dadosSubTab === 2 && (
                <div style={{ animation: 'fadeIn 0.2s ease' }}>
                  <div className="section-title-tag">
                    <Activity size={16} /> Avaliação Antropométrica & Clínica
                  </div>

                  {/* Peso, Altura e IMC */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '20px', marginBottom: '24px', alignItems: 'flex-start' }}>
                    <div className="form-group">
                      <label className="form-label">Peso inicial (kg)</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Ex: 72.5"
                          value={editForm.peso_inicial}
                          onChange={(e) => setEditForm({ ...editForm, peso_inicial: e.target.value })}
                          className="form-input"
                          style={{ paddingRight: '45px' }}
                        />
                        <span className="input-suffix">kg</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Altura (cm)</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          step="1"
                          placeholder="Ex: 168"
                          value={editForm.altura}
                          onChange={(e) => setEditForm({ ...editForm, altura: e.target.value })}
                          className="form-input"
                          style={{ paddingRight: '45px' }}
                        />
                        <span className="input-suffix">cm</span>
                      </div>
                    </div>

                    <div className="imc-calc-box">
                      <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        IMC Calculado
                      </div>
                      {imcInfo ? (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                          <span style={{ fontSize: '24px', fontWeight: '800', color: imcInfo.cor }}>
                            {imcInfo.valor}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: imcInfo.cor }}>
                            {imcInfo.classificacao}
                          </span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Preencha peso e altura para calcular
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Objetivos */}
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label className="form-label">Objetivo principal</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      {OBJETIVOS_OPCOES.map((obj) => {
                        const isSelected = editForm.objetivos?.includes(obj);
                        return (
                          <button
                            key={obj}
                            type="button"
                            onClick={() => handleToggleMulti('objetivos', obj)}
                            className={`chip-select-btn ${isSelected ? 'selected' : ''}`}
                          >
                            {isSelected && <Check size={13} strokeWidth={3} />}
                            <span>{obj}</span>
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      placeholder="Detalhes adicionais do objetivo..."
                      value={editForm.objetivo_texto}
                      onChange={(e) => setEditForm({ ...editForm, objetivo_texto: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  {/* Nível de Atividade Física */}
                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label className="form-label">Nível de atividade física</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {NIVEIS_ATIVIDADE.map((nv) => (
                        <button
                          key={nv}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, nivel_atividade: nv })}
                          className={`chip-select-btn ${editForm.nivel_atividade === nv ? 'selected' : ''}`}
                        >
                          {nv}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Patologias */}
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label className="form-label">Patologias ou condições de saúde</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      {PATOLOGIAS_OPCOES.map((pat) => {
                        const isSelected = editForm.patologias?.includes(pat);
                        return (
                          <button
                            key={pat}
                            type="button"
                            onClick={() => handleToggleMulti('patologias', pat)}
                            className={`chip-select-btn ${isSelected ? 'selected' : ''}`}
                          >
                            {isSelected && <Check size={13} strokeWidth={3} />}
                            <span>{pat}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Adicionar outra patologia..."
                        value={editForm.patologia_custom}
                        onChange={(e) => setEditForm({ ...editForm, patologia_custom: e.target.value })}
                        className="form-input"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCustomTag('patologias', 'patologia_custom')}
                        className="btn-icon-secondary"
                        style={{ width: 'auto', padding: '0 16px' }}
                      >
                        <Plus size={15} /> Adicionar
                      </button>
                    </div>
                  </div>

                  {/* Restrições Alimentares */}
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label className="form-label">Restrições alimentares</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      {RESTRICOES_OPCOES.map((rest) => {
                        const isSelected = editForm.restricoes_alimentares?.includes(rest);
                        return (
                          <button
                            key={rest}
                            type="button"
                            onClick={() => handleToggleMulti('restricoes_alimentares', rest)}
                            className={`chip-select-btn ${isSelected ? 'selected' : ''}`}
                          >
                            {isSelected && <Check size={13} strokeWidth={3} />}
                            <span>{rest}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Adicionar outra restrição alimentar..."
                        value={editForm.restricao_custom}
                        onChange={(e) => setEditForm({ ...editForm, restricao_custom: e.target.value })}
                        className="form-input"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCustomTag('restricoes_alimentares', 'restricao_custom')}
                        className="btn-icon-secondary"
                        style={{ width: 'auto', padding: '0 16px' }}
                      >
                        <Plus size={15} /> Adicionar
                      </button>
                    </div>
                  </div>

                  {/* Alergias Alimentares */}
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label className="form-label">Alergias alimentares</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      {ALERGIAS_OPCOES.map((al) => {
                        const isSelected = editForm.alergias?.includes(al);
                        return (
                          <button
                            key={al}
                            type="button"
                            onClick={() => handleToggleMulti('alergias', al)}
                            className={`chip-select-btn ${isSelected ? 'selected' : ''}`}
                          >
                            {isSelected && <Check size={13} strokeWidth={3} />}
                            <span>{al}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Adicionar outra alergia..."
                        value={editForm.alergia_custom}
                        onChange={(e) => setEditForm({ ...editForm, alergia_custom: e.target.value })}
                        className="form-input"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCustomTag('alergias', 'alergia_custom')}
                        className="btn-icon-secondary"
                        style={{ width: 'auto', padding: '0 16px' }}
                      >
                        <Plus size={15} /> Adicionar
                      </button>
                    </div>
                  </div>

                  {/* Medicamentos e Suplementos */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group">
                      <label className="form-label">Medicamentos contínuos</label>
                      <textarea
                        rows={2}
                        placeholder="Ex: Levotiroxina 50mcg..."
                        value={editForm.medicamentos}
                        onChange={(e) => setEditForm({ ...editForm, medicamentos: e.target.value })}
                        className="form-input"
                        style={{ height: 'auto', resize: 'vertical' }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Suplementos em uso</label>
                      <textarea
                        rows={2}
                        placeholder="Ex: Whey Protein, Creatina 5g..."
                        value={editForm.suplementos}
                        onChange={(e) => setEditForm({ ...editForm, suplementos: e.target.value })}
                        className="form-input"
                        style={{ height: 'auto', resize: 'vertical' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-ABA 3: HÁBITOS */}
              {dadosSubTab === 3 && (
                <div style={{ animation: 'fadeIn 0.2s ease' }}>
                  <div className="section-title-tag">
                    <Clock size={16} /> Rotina Diária, Ingestão Hídrica e Hábitos
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div className="form-group">
                      <label className="form-label">Refeições por dia</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        placeholder="Ex: 4"
                        value={editForm.refeicoes_por_dia}
                        onChange={(e) => setEditForm({ ...editForm, refeicoes_por_dia: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Horário que acorda</label>
                      <input
                        type="text"
                        placeholder="Ex: 06:30"
                        value={editForm.horario_acorda}
                        onChange={(e) => setEditForm({ ...editForm, horario_acorda: e.target.value })}
                        onBlur={(e) => setEditForm({ ...editForm, horario_acorda: formatTimeInput(e.target.value) })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Horário que dorme</label>
                      <input
                        type="text"
                        placeholder="Ex: 23:00"
                        value={editForm.horario_dorme}
                        onChange={(e) => setEditForm({ ...editForm, horario_dorme: e.target.value })}
                        onBlur={(e) => setEditForm({ ...editForm, horario_dorme: formatTimeInput(e.target.value) })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Água por dia</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Ex: 2.5"
                          value={editForm.litros_agua}
                          onChange={(e) => setEditForm({ ...editForm, litros_agua: e.target.value })}
                          className="form-input"
                          style={{ paddingRight: '55px' }}
                        />
                        <span className="input-suffix">litros</span>
                      </div>
                    </div>
                  </div>

                  {/* Atividade Física */}
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label className="form-label">Pratica atividade física?</label>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, atividade_fisica: true })}
                        className={`chip-select-btn ${editForm.atividade_fisica ? 'selected' : ''}`}
                        style={{ flex: 1 }}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, atividade_fisica: false })}
                        className={`chip-select-btn ${!editForm.atividade_fisica ? 'selected' : ''}`}
                        style={{ flex: 1 }}
                      >
                        Não
                      </button>
                    </div>

                    {editForm.atividade_fisica && (
                      <input
                        type="text"
                        placeholder="Quais exercícios e frequência? (Ex: Musculação 4x na semana)..."
                        value={editForm.atividade_fisica_descricao}
                        onChange={(e) => setEditForm({ ...editForm, atividade_fisica_descricao: e.target.value })}
                        className="form-input"
                      />
                    )}
                  </div>

                  {/* Observações Gerais */}
                  <div className="form-group">
                    <label className="form-label">Observações adicionais da rotina</label>
                    <textarea
                      rows={3}
                      placeholder="Preferências, aversões alimentares ou rotina de trabalho..."
                      value={editForm.observacoes}
                      onChange={(e) => setEditForm({ ...editForm, observacoes: e.target.value })}
                      className="form-input"
                      style={{ height: 'auto', resize: 'vertical' }}
                    />
                  </div>
                </div>
              )}

              {/* Botão de Salvar no Rodapé */}
              <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: 'auto', padding: '0 28px', height: '44px', fontSize: '14px', fontWeight: '800' }}
                  disabled={savingPaciente}
                >
                  <Save size={16} />
                  <span>{savingPaciente ? 'Salvando alterações...' : 'Salvar alterações'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 3: PLANOS ALIMENTARES */}
      {/* ========================================================================= */}
      {activeTab === 'planos' && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          {/* Header com o Botão de Destaque "+ Gerar Plano Alimentar" */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Utensils size={20} style={{ color: 'var(--primary)' }} /> Planos Alimentares e Prescrições Dietéticas
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Histórico de dietas e planos alimentares calculados e salvos para este paciente no Neon.
              </p>
            </div>

            <button
              className="btn-primary"
              style={{
                width: 'auto',
                padding: '0 24px',
                height: '42px',
                fontSize: '14px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                boxShadow: '0 8px 20px rgba(220, 38, 38, 0.25)'
              }}
              onClick={() => setIsGerarPlanoModalOpen(true)}
            >
              <Sparkles size={16} />
              <span>Gerar Plano Alimentar</span>
            </button>
          </div>

          {/* Histórico de Planos Alimentares */}
          {planos.length === 0 ? (
            <div className="dash-card-full" style={{ padding: '60px 20px', textAlign: 'center', background: '#ffffff' }}>
              <div className="empty-state-icon" style={{ width: '56px', height: '56px', background: '#fef2f2', color: 'var(--primary)', margin: '0 auto 16px auto', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Utensils size={28} />
              </div>
              <div style={{ fontWeight: '900', fontSize: '17px', color: 'var(--text-main)' }}>
                Nenhum plano alimentar gerado ainda
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '420px', margin: '6px auto 20px auto' }}>
                Os planos nutricionais gerados ou personalizados para este paciente aparecerão listados aqui em ordem cronológica.
              </p>
              <button
                className="btn-primary"
                style={{ width: 'auto', margin: '0 auto' }}
                onClick={() => setIsGerarPlanoModalOpen(true)}
              >
                <Sparkles size={15} /> Gerar Primeiro Plano
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
              {planos.map((plano) => {
                const titulo = plano.titulo || plano.conteudo?.titulo || 'Plano Alimentar Personalizado';
                const calorias = plano.conteudo?.caloriasTotais || plano.conteudo?.calorias || '1850';
                const proteinas = plano.conteudo?.proteinas || '130';
                const carbo = plano.conteudo?.carboidratos || '180';
                const gorduras = plano.conteudo?.gorduras || '55';
                const totalRefeicoes = Array.isArray(plano.conteudo?.refeicoes) ? plano.conteudo.refeicoes.length : 6;
                const dataGeracao = new Date(plano.created_at).toLocaleDateString('pt-BR');

                return (
                  <div
                    key={plano.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xl)',
                      padding: '22px',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '16px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: '12px' }}>
                          ● Salvo no Neon
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                          {dataGeracao}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '17px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '8px' }}>
                        {titulo}
                      </h3>

                      {/* Resumo de Macros */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', background: '#fafafa', padding: '10px', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '12px' }}>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Calorias</div>
                          <strong style={{ color: 'var(--primary)' }}>{calorias} kcal</strong>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Proteínas</div>
                          <strong>{proteinas}g</strong>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Carboidratos</div>
                          <strong>{carbo}g</strong>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Gorduras</div>
                          <strong>{gorduras}g</strong>
                        </div>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
                        Contém <strong>{totalRefeicoes} refeições estruturadas</strong> com horários e opções.
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ flex: 1, height: '38px', fontSize: '13px' }}
                        onClick={() => {
                          setSelectedPlano(plano);
                          setIsPlanoModalOpen(true);
                        }}
                      >
                        <Eye size={15} /> Visualizar Plano
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVA CONSULTA (Prompt 5) */}
      {/* ========================================================================= */}
      {isNewConsultaOpen && (
        <div className="modal-overlay" onClick={() => setIsNewConsultaOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <CalendarCheck size={20} style={{ color: 'var(--primary)' }} />
                <span>Registrar Nova Consulta</span>
              </div>
              <button className="btn-close" onClick={() => setIsNewConsultaOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {consultaError && (
              <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                <AlertCircle size={16} />
                <span>{consultaError}</span>
              </div>
            )}

            <form onSubmit={handleCreateConsultaSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                {/* Data da Consulta (Obrigatório) */}
                <div className="form-group">
                  <label className="form-label">
                    Data da Consulta <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={consultaForm.data_consulta}
                    onChange={(e) => setConsultaForm({ ...consultaForm, data_consulta: e.target.value })}
                    className="form-input"
                  />
                </div>

                {/* Próximo Retorno (Opcional) */}
                <div className="form-group">
                  <label className="form-label">Próximo Retorno (opcional)</label>
                  <input
                    type="date"
                    value={consultaForm.proximo_retorno}
                    onChange={(e) => setConsultaForm({ ...consultaForm, proximo_retorno: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Medidas: Peso, Cintura, Quadril, % Gordura */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                {/* Peso Atual (Obrigatório) */}
                <div className="form-group">
                  <label className="form-label">
                    Peso atual (kg) <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="Ex: 68.5"
                    value={consultaForm.peso}
                    onChange={(e) => setConsultaForm({ ...consultaForm, peso: e.target.value })}
                    className="form-input"
                  />
                </div>

                {/* % de Gordura (Opcional) */}
                <div className="form-group">
                  <label className="form-label">% de gordura (opcional)</label>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                {/* Cintura (cm, Opcional) */}
                <div className="form-group">
                  <label className="form-label">Cintura (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 75.0"
                    value={consultaForm.cintura}
                    onChange={(e) => setConsultaForm({ ...consultaForm, cintura: e.target.value })}
                    className="form-input"
                  />
                </div>

                {/* Quadril (cm, Opcional) */}
                <div className="form-group">
                  <label className="form-label">Quadril (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 98.0"
                    value={consultaForm.quadril}
                    onChange={(e) => setConsultaForm({ ...consultaForm, quadril: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="form-group" style={{ marginBottom: '22px' }}>
                <label className="form-label">Observações da Consulta</label>
                <textarea
                  rows={3}
                  placeholder="Relato do paciente, alterações no apetite, adesão ao plano, novas metas..."
                  value={consultaForm.observacoes}
                  onChange={(e) => setConsultaForm({ ...consultaForm, observacoes: e.target.value })}
                  className="form-input"
                  style={{ height: 'auto', resize: 'vertical' }}
                />
              </div>

              {/* Botões do Modal */}
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
                  {savingConsulta ? 'Salvando consulta...' : 'Salvar consulta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VISUALIZAR PLANO ALIMENTAR (Leitura Completa) */}
      {/* ========================================================================= */}
      {isPlanoModalOpen && selectedPlano && (
        <div className="modal-overlay" onClick={() => setIsPlanoModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div className="modal-title">
                <Utensils size={20} style={{ color: 'var(--primary)' }} />
                <span>{selectedPlano.titulo || 'Plano Alimentar'}</span>
              </div>
              <button className="btn-close" onClick={() => setIsPlanoModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Criado em {new Date(selectedPlano.created_at).toLocaleDateString('pt-BR')} • Paciente: <strong>{patientData.nome}</strong>
              </span>
            </div>

            {/* Refeições do Plano */}
            {selectedPlano.conteudo && typeof selectedPlano.conteudo === 'object' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {Array.isArray(selectedPlano.conteudo.refeicoes) && (
                  selectedPlano.conteudo.refeicoes.map((ref, idx) => (
                    <div
                      key={ref.id || idx}
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        background: '#fafafa'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong style={{ color: 'var(--text-main)', fontSize: '15px' }}>
                          {ref.nome || `${idx + 1}ª Refeição`}
                        </strong>
                        {ref.horario && (
                          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: '10px' }}>
                            {ref.horario}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                        {ref.alimentos || 'Alimentos prescritos para esta refeição.'}
                      </p>
                    </div>
                  ))
                )}

                {selectedPlano.conteudo.orientacoesGerais && (
                  <div style={{ marginTop: '10px', background: '#fef2f2', border: '1px solid var(--primary-border)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                    <strong style={{ fontSize: '13px', color: '#991b1b', display: 'block', marginBottom: '4px' }}>
                      Orientações Gerais:
                    </strong>
                    <p style={{ fontSize: '13px', color: '#7f1d1d', lineHeight: '1.5' }}>
                      {selectedPlano.conteudo.orientacoesGerais}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn-primary"
                style={{ width: 'auto' }}
                onClick={() => setIsPlanoModalOpen(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL INFORMATIVO: GERAR PLANO ALIMENTAR (Preparado para o Prompt 6) */}
      {/* ========================================================================= */}
      {isGerarPlanoModalOpen && (
        <div className="modal-overlay" onClick={() => setIsGerarPlanoModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', background: '#fef2f2', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <Sparkles size={28} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '8px' }}>
              Gerador de Plano Alimentar
            </h3>

            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
              O botão <strong>"Gerar Plano Alimentar"</strong> foi configurado com sucesso e está visualmente preparado para a próxima etapa (Prompt 6), onde a IA e os cálculos nutricionais automáticos serão integrados.
            </p>

            <button
              className="btn-primary"
              style={{ width: '100%' }}
              onClick={() => setIsGerarPlanoModalOpen(false)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMAR EXCLUSÃO DO PACIENTE */}
      {/* ========================================================================= */}
      {isConfirmDeleteOpen && (
        <div className="modal-overlay" onClick={() => setIsConfirmDeleteOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ width: '54px', height: '54px', background: '#fef2f2', color: 'var(--danger)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto' }}>
              <Trash2 size={26} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '8px' }}>
              Excluir Paciente?
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '22px', lineHeight: '1.5' }}>
              Tem certeza de que deseja excluir <strong>{patientData.nome}</strong>? Todas as consultas e planos alimentares associados serão permanentemente removidos do Neon.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn-icon-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setIsConfirmDeleteOpen(false)}
                disabled={deletingPatient}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1, background: 'var(--danger)' }}
                onClick={handleDeletePatientConfirmed}
                disabled={deletingPatient}
              >
                {deletingPatient ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
