import React, { useState, useMemo } from 'react';
import { 
  User, 
  Activity, 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Check, 
  Plus, 
  X, 
  AlertCircle, 
  Sparkles,
  Info,
  Calendar,
  Phone,
  Mail,
  Heart,
  Droplet
} from 'lucide-react';
import { createPaciente } from '../lib/neonClient';

// Opções pré-definidas
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

// Utilitário para formatar horário (ex: 6 -> 06:00, 630 -> 06:30, 2230 -> 22:30)
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

// Utilitário para formatar telefone
function formatPhone(value) {
  if (!value) return '';
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  }
  return clean.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
}

export default function PatientFormScreen({ user, onCancel, onSaveSuccess }) {
  const [currentTab, setCurrentTab] = useState(1); // 1: Pessoal, 2: Clínico, 3: Hábitos
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados do Formulário
  const [formData, setFormData] = useState({
    // Aba 1 - Pessoal
    nome: '',
    data_nascimento: '',
    sexo: 'Feminino',
    telefone: '',
    whatsapp: '',
    email: '',

    // Aba 2 - Clínico
    peso_inicial: '', // em kg
    altura: '', // em cm
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

    // Aba 3 - Hábitos
    refeicoes_por_dia: '',
    horario_acorda: '',
    horario_dorme: '',
    litros_agua: '',
    atividade_fisica: false,
    atividade_fisica_descricao: '',
    observacoes: ''
  });

  // Cálculo de Idade a partir da Data de Nascimento
  const calculatedAge = useMemo(() => {
    if (!formData.data_nascimento) return null;
    const birthDate = new Date(formData.data_nascimento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return isNaN(age) || age < 0 ? null : age;
  }, [formData.data_nascimento]);

  // Cálculo de IMC Automático
  const imcInfo = useMemo(() => {
    const peso = parseFloat(formData.peso_inicial);
    const alturaCm = parseFloat(formData.altura);

    if (!peso || !alturaCm || alturaCm <= 0) return null;

    const alturaM = alturaCm / 100;
    const imc = peso / (alturaM * alturaM);
    const imcFormatted = imc.toFixed(1);

    let classificacao = 'Normal';
    let cor = '#059669'; // verde

    if (imc < 18.5) {
      classificacao = 'Baixo peso';
      cor = '#0284c7'; // azul
    } else if (imc >= 18.5 && imc < 24.9) {
      classificacao = 'Peso normal (Adequado)';
      cor = '#059669'; // verde
    } else if (imc >= 25 && imc < 29.9) {
      classificacao = 'Sobrepeso';
      cor = '#d97706'; // âmbar
    } else if (imc >= 30 && imc < 34.9) {
      classificacao = 'Obesidade Grau I';
      cor = '#ea580c'; // laranja
    } else if (imc >= 35 && imc < 39.9) {
      classificacao = 'Obesidade Grau II';
      cor = '#dc2626'; // vermelho
    } else {
      classificacao = 'Obesidade Grau III (Mórbida)';
      cor = '#991b1b'; // vinho
    }

    return { valor: imcFormatted, classificacao, cor };
  }, [formData.peso_inicial, formData.altura]);

  // Handlers para múltipla escolha com suporte a "Nenhum"
  const handleToggleMulti = (field, item) => {
    setFormData((prev) => {
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
    const tag = formData[customInputKey]?.trim();
    if (!tag) return;
    setFormData((prev) => {
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

  const handleRemoveTag = (field, tag) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((i) => i !== tag)
    }));
  };

  // Submit do formulário completo
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!formData.nome.trim()) {
      setErrorMsg('O campo Nome Completo é obrigatório.');
      setCurrentTab(1);
      return;
    }

    setErrorMsg('');
    setSaving(true);

    try {
      // Ajustar altura para metros ao persistir caso tenha sido informada em cm
      const alturaMetros = formData.altura ? Number(formData.altura) / 100 : null;

      const pacientePayload = {
        ...formData,
        altura: alturaMetros,
        peso_inicial: formData.peso_inicial ? Number(formData.peso_inicial) : null,
      };

      const novoPaciente = await createPaciente(pacientePayload, user.id);
      onSaveSuccess(novoPaciente);
    } catch (err) {
      console.error('Erro ao salvar paciente:', err);
      setErrorMsg(err.message || 'Erro ao cadastrar paciente no Neon.');
      setSaving(false);
    }
  };

  return (
    <div className="patient-form-container" style={{ animation: 'fadeIn 0.25s ease' }}>
      {/* Header com Voltar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={onCancel}
            className="btn-icon-secondary"
            style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, justifyContent: 'center' }}
            title="Voltar para a listagem"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
              Novo Paciente
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Cadastre a anamnese completa do seu paciente no Neon.
            </p>
          </div>
        </div>

        {/* Indicador de progresso */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)' }}>
            Aba {currentTab} de 3
          </span>
        </div>
      </div>

      {/* Alerta de erro se houver */}
      {errorMsg && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Abas Superiores */}
      <div className="form-tabs-header">
        <button
          type="button"
          className={`form-tab-btn ${currentTab === 1 ? 'active' : ''}`}
          onClick={() => setCurrentTab(1)}
        >
          <div className="form-tab-number">1</div>
          <div style={{ textAlign: 'left' }}>
            <div className="form-tab-title">Pessoal</div>
            <div className="form-tab-desc">Dados básicos & contato</div>
          </div>
        </button>

        <button
          type="button"
          className={`form-tab-btn ${currentTab === 2 ? 'active' : ''}`}
          onClick={() => setCurrentTab(2)}
        >
          <div className="form-tab-number">2</div>
          <div style={{ textAlign: 'left' }}>
            <div className="form-tab-title">Clínico</div>
            <div className="form-tab-desc">Peso, IMC & Anamnese</div>
          </div>
        </button>

        <button
          type="button"
          className={`form-tab-btn ${currentTab === 3 ? 'active' : ''}`}
          onClick={() => setCurrentTab(3)}
        >
          <div className="form-tab-number">3</div>
          <div style={{ textAlign: 'left' }}>
            <div className="form-tab-title">Hábitos</div>
            <div className="form-tab-desc">Rotina, água & sono</div>
          </div>
        </button>
      </div>

      {/* Conteúdo do Card do Formulário */}
      <div className="form-card-body">
        {/* ========================================================================= */}
        {/* ABA 1: PESSOAL */}
        {/* ========================================================================= */}
        {currentTab === 1 && (
          <div className="tab-pane-content" style={{ animation: 'fadeIn 0.2s ease' }}>
            <div className="section-title-tag">
              <User size={16} /> Dados Pessoais do Paciente
            </div>

            {/* Nome Completo (Obrigatório) */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">
                Nome completo <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Amanda Silva Santos"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="form-input"
                style={{ fontSize: '15px', fontWeight: '600' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
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
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Sexo (Seleção Única) */}
              <div className="form-group">
                <label className="form-label">Sexo</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['Feminino', 'Masculino', 'Outro'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({ ...formData, sexo: s })}
                      className={`chip-select-btn ${formData.sexo === s ? 'selected' : ''}`}
                      style={{ flex: 1 }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              {/* Telefone */}
              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input
                  type="text"
                  placeholder="(11) 3333-4444"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                  className="form-input"
                />
              </div>

              {/* WhatsApp */}
              <div className="form-group">
                <label className="form-label">WhatsApp</label>
                <input
                  type="text"
                  placeholder="(11) 99999-8888"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: formatPhone(e.target.value) })}
                  className="form-input"
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input
                  type="email"
                  placeholder="paciente@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: CLÍNICO */}
        {/* ========================================================================= */}
        {currentTab === 2 && (
          <div className="tab-pane-content" style={{ animation: 'fadeIn 0.2s ease' }}>
            <div className="section-title-tag">
              <Activity size={16} /> Avaliação Antropométrica & Clínica
            </div>

            {/* Peso, Altura e IMC */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '20px', marginBottom: '24px', alignItems: 'flex-start' }}>
              {/* Peso em kg */}
              <div className="form-group">
                <label className="form-label">Peso atual</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 72.5"
                    value={formData.peso_inicial}
                    onChange={(e) => setFormData({ ...formData, peso_inicial: e.target.value })}
                    className="form-input"
                    style={{ paddingRight: '45px' }}
                  />
                  <span className="input-suffix">kg</span>
                </div>
              </div>

              {/* Altura em cm */}
              <div className="form-group">
                <label className="form-label">Altura</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="1"
                    placeholder="Ex: 168"
                    value={formData.altura}
                    onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                    className="form-input"
                    style={{ paddingRight: '45px' }}
                  />
                  <span className="input-suffix">cm</span>
                </div>
              </div>

              {/* IMC Calculado Automaticamente */}
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

            {/* Objetivos (Múltipla Escolha) */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Objetivo principal (selecione um ou mais)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                {OBJETIVOS_OPCOES.map((obj) => {
                  const isSelected = formData.objetivos?.includes(obj);
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
                placeholder="Detalhes adicionais do objetivo (ex: foco na perda de gordura abdominal)..."
                value={formData.objetivo_texto}
                onChange={(e) => setFormData({ ...formData, objetivo_texto: e.target.value })}
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
                    onClick={() => setFormData({ ...formData, nivel_atividade: nv })}
                    className={`chip-select-btn ${formData.nivel_atividade === nv ? 'selected' : ''}`}
                  >
                    {nv}
                  </button>
                ))}
              </div>
            </div>

            {/* Patologias ou Condições de Saúde */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Patologias ou condições de saúde</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                {PATOLOGIAS_OPCOES.map((pat) => {
                  const isSelected = formData.patologias?.includes(pat);
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
                  value={formData.patologia_custom}
                  onChange={(e) => setFormData({ ...formData, patologia_custom: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag('patologias', 'patologia_custom');
                    }
                  }}
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
                  const isSelected = formData.restricoes_alimentares?.includes(rest);
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
                  value={formData.restricao_custom}
                  onChange={(e) => setFormData({ ...formData, restricao_custom: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag('restricoes_alimentares', 'restricao_custom');
                    }
                  }}
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
                  const isSelected = formData.alergias?.includes(al);
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
                  value={formData.alergia_custom}
                  onChange={(e) => setFormData({ ...formData, alergia_custom: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag('alergias', 'alergia_custom');
                    }
                  }}
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
                  placeholder="Ex: Levotiroxina 50mcg, Losartana 50mg..."
                  value={formData.medicamentos}
                  onChange={(e) => setFormData({ ...formData, medicamentos: e.target.value })}
                  className="form-input"
                  style={{ height: 'auto', resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Suplementos em uso</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Whey Protein, Creatina 5g, Vitamina D..."
                  value={formData.suplementos}
                  onChange={(e) => setFormData({ ...formData, suplementos: e.target.value })}
                  className="form-input"
                  style={{ height: 'auto', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 3: HÁBITOS */}
        {/* ========================================================================= */}
        {currentTab === 3 && (
          <div className="tab-pane-content" style={{ animation: 'fadeIn 0.2s ease' }}>
            <div className="section-title-tag">
              <Clock size={16} /> Rotina diária, ingestão hídrica e hábitos
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              {/* Refeições por dia */}
              <div className="form-group">
                <label className="form-label">Refeições por dia</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  placeholder="Ex: 4"
                  value={formData.refeicoes_por_dia}
                  onChange={(e) => setFormData({ ...formData, refeicoes_por_dia: e.target.value })}
                  className="form-input"
                />
              </div>

              {/* Horário que acorda */}
              <div className="form-group">
                <label className="form-label">Horário que acorda</label>
                <input
                  type="text"
                  placeholder="Ex: 06:30"
                  value={formData.horario_acorda}
                  onChange={(e) => setFormData({ ...formData, horario_acorda: e.target.value })}
                  onBlur={(e) => setFormData({ ...formData, horario_acorda: formatTimeInput(e.target.value) })}
                  className="form-input"
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  Autoformata ex: 6 → 06:00, 630 → 06:30
                </span>
              </div>

              {/* Horário que dorme */}
              <div className="form-group">
                <label className="form-label">Horário que dorme</label>
                <input
                  type="text"
                  placeholder="Ex: 23:00"
                  value={formData.horario_dorme}
                  onChange={(e) => setFormData({ ...formData, horario_dorme: e.target.value })}
                  onBlur={(e) => setFormData({ ...formData, horario_dorme: formatTimeInput(e.target.value) })}
                  className="form-input"
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  Autoformata ex: 23 → 23:00, 2230 → 22:30
                </span>
              </div>

              {/* Quantidade de água por dia */}
              <div className="form-group">
                <label className="form-label">Água por dia</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 2.5"
                    value={formData.litros_agua}
                    onChange={(e) => setFormData({ ...formData, litros_agua: e.target.value })}
                    className="form-input"
                    style={{ paddingRight: '55px' }}
                  />
                  <span className="input-suffix">litros</span>
                </div>
              </div>
            </div>

            {/* Pratica Atividade Física */}
            <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '18px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: formData.atividade_fisica ? '14px' : '0' }}>
                <div>
                  <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>Pratica atividade física regularmente?</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Musculação, corrida, natação, etc.</div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, atividade_fisica: true })}
                    className={`chip-select-btn ${formData.atividade_fisica ? 'selected' : ''}`}
                    style={{ minWidth: '70px', justifyContent: 'center' }}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, atividade_fisica: false, atividade_fisica_descricao: '' })}
                    className={`chip-select-btn ${!formData.atividade_fisica ? 'selected' : ''}`}
                    style={{ minWidth: '70px', justifyContent: 'center' }}
                  >
                    Não
                  </button>
                </div>
              </div>

              {formData.atividade_fisica && (
                <div className="form-group" style={{ animation: 'fadeIn 0.2s ease', marginTop: '12px' }}>
                  <label className="form-label">Qual atividade e frequência semanal?</label>
                  <input
                    type="text"
                    placeholder="Ex: Musculação 4x na semana + Corrida 2x aos sábados"
                    value={formData.atividade_fisica_descricao}
                    onChange={(e) => setFormData({ ...formData, atividade_fisica_descricao: e.target.value })}
                    className="form-input"
                  />
                </div>
              )}
            </div>

            {/* Observações Gerais */}
            <div className="form-group">
              <label className="form-label">Observações gerais</label>
              <textarea
                rows={3}
                placeholder="Anotações adicionais, preferências alimentares, rotina de trabalho..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="form-input"
                style={{ height: 'auto', resize: 'vertical' }}
              />
            </div>
          </div>
        )}

        {/* Rodapé de Ações do Formulário */}
        <div className="form-actions-footer">
          <div>
            {currentTab > 1 && (
              <button
                type="button"
                onClick={() => setCurrentTab(currentTab - 1)}
                className="btn-icon-secondary"
                style={{ width: 'auto', padding: '0 20px', height: '44px' }}
              >
                <ArrowLeft size={16} /> Voltar aba
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onCancel}
              className="btn-icon-secondary"
              style={{ width: 'auto', padding: '0 20px', height: '44px' }}
            >
              Cancelar
            </button>

            {currentTab < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentTab === 1 && !formData.nome.trim()) {
                    setErrorMsg('Por favor, informe o Nome Completo antes de prosseguir.');
                    return;
                  }
                  setErrorMsg('');
                  setCurrentTab(currentTab + 1);
                }}
                className="btn-primary"
                style={{ width: 'auto', padding: '0 24px', height: '44px' }}
              >
                <span>Avançar</span> <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="btn-primary"
                style={{ width: 'auto', padding: '0 28px', height: '44px' }}
              >
                <Save size={16} />
                <span>{saving ? 'Salvando no Neon...' : 'Salvar Paciente'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
