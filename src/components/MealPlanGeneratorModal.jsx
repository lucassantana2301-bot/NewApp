import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Utensils, 
  Flame, 
  Check, 
  Printer, 
  Share2, 
  Save, 
  Clock, 
  RefreshCw, 
  Calculator, 
  Apple, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Activity,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { calculateMetabolicNeeds, savePlanoAlimentar } from '../lib/neonClient';

// Base de cardápios inteligentes por objetivo
const BANCO_REFEICOES = {
  emagrecimento: [
    { id: 'cafe', nome: 'Café da Manhã', horario: '07:30', alimentos: '2 ovos mexidos com cúrcuma + 1 fatia de pão 100% integral + 1 xícara de café preto sem açúcar + 1 fatia de melão' },
    { id: 'lanche_m', nome: 'Lanche da Manhã', horario: '10:00', alimentos: '1 maçã com casca + 15g de castanhas de caju ou nozes (gorduras boas e saciedade)' },
    { id: 'almoco', nome: 'Almoço', horario: '12:30', alimentos: '130g de peito de frango grelhado + 90g de arroz integral + 1 concha rasa de feijão + Salada colorida à vontade (rúcula, tomate, pepino) com 1 colher de sobremesa de azeite' },
    { id: 'lanche_t', nome: 'Lanche da Tarde', horario: '16:00', alimentos: '1 iogurte natural desnatado + 20g de aveia em flocos finos + 1 scoop (25g) de Whey Protein isolado' },
    { id: 'jantar', nome: 'Jantar', horario: '19:30', alimentos: '140g de tilápia ou patinho moído + 100g de abóbora cabotiá assada + Brócolis e abobrinha no vapor à vontade' },
    { id: 'ceia', nome: 'Ceia', horario: '22:00', alimentos: 'Chá de camomila ou erva-doce sem açúcar + 1 quadradinho de chocolate amargo 70%' }
  ],
  hipertrofia: [
    { id: 'cafe', nome: 'Café da Manhã', horario: '07:30', alimentos: '3 ovos mexidos + 2 fatias de pão integral com pasta de amendoim (15g) + 1 banana com canela + 200ml de leite desnatado' },
    { id: 'lanche_m', nome: 'Lanche da Manhã', horario: '10:30', alimentos: '1 scoop de Whey Protein + 40g de aveia + 1 maçã picada' },
    { id: 'almoco', nome: 'Almoço', horario: '13:00', alimentos: '180g de patinho moído ou peito de frango + 180g de arroz integral + 1 concha cheia de feijão + Salada verde com azeite' },
    { id: 'pre_treino', nome: 'Pré-Treino / Lanche', horario: '16:30', alimentos: '150g de batata doce ou mandioca cozida + 120g de filé de frango desfiado + 5g de creatina' },
    { id: 'jantar', nome: 'Jantar Pós-Treino', horario: '20:00', alimentos: '180g de filé de salmão ou carne vermelha magra + 200g de arroz ou purê de batata inglesa + Legumes salteados' },
    { id: 'ceia', nome: 'Ceia Anabólica', horario: '22:30', alimentos: '1 pote de iogurte grego natural + 20g de castanhas do pará + 1 dose de caseína ou albumina' }
  ],
  reeducacao: [
    { id: 'cafe', nome: 'Café da Manhã', horario: '08:00', alimentos: '1 tapioca pequena com 2 ovos mexidos e queijo branco + 1 xícara de café com leite desnatado + 1 kiwi' },
    { id: 'lanche_m', nome: 'Lanche da Manhã', horario: '10:30', alimentos: 'Mix de castanhas e uvas passas (30g) + Chá verde' },
    { id: 'almoco', nome: 'Almoço Equilibrado', horario: '12:30', alimentos: '140g de frango grelhado ou peixe + 120g de arroz com grãos + 1 concha de feijão + Prato de salada variada' },
    { id: 'lanche_t', nome: 'Lanche da Tarde', horario: '16:30', alimentos: 'Vitamina de frutas (200ml leite vegetal ou desnatado + 1 banana + 1 colher de chia + 20g aveia)' },
    { id: 'jantar', nome: 'Jantar Leve', horario: '19:30', alimentos: 'Omelete de 2 ovos com espinafre e tomate + 1 fatia de pão integral + Salada de folhas' },
    { id: 'ceia', nome: 'Ceia', horario: '22:00', alimentos: 'Chá de melissa ou hortelã com gotas de própolis' }
  ]
};

export default function MealPlanGeneratorModal({ patient, isOpen, onClose, onPlanSaved }) {
  const [step, setStep] = useState(1); // 1: Cálculo & Metas, 2: Personalização & Cardápio, 3: Visualização / Exportação
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Parâmetros do Paciente
  const [metabolicData, setMetabolicData] = useState({
    peso: patient?.peso_inicial || 70,
    alturaCm: patient?.altura ? (Number(patient?.altura) > 3 ? Number(patient?.altura) : Math.round(Number(patient?.altura) * 100)) : 168,
    idade: 30,
    sexo: patient?.sexo || 'Feminino',
    nivelAtividade: patient?.nivel_atividade || 'Moderadamente ativo',
    objetivo: patient?.objetivo_texto || (Array.isArray(patient?.objetivos) ? patient?.objetivos.join(', ') : 'Emagrecimento')
  });

  // Resultados Metabólicos
  const [calcResult, setCalcResult] = useState({
    tmb: 1450,
    get: 2100,
    caloriasAlvo: 1700,
    macros: { proteinas: 130, carboidratos: 160, gorduras: 55 }
  });

  // Estrutura do Plano Gerado
  const [planoTitulo, setPlanoTitulo] = useState('Plano Nutricional Personalizado IA');
  const [refeicoes, setRefeicoes] = useState([]);
  const [orientacoes, setOrientacoes] = useState(
    'Beber no mínimo 35ml de água por kg de peso corporal ao dia. Priorizar alimentos in natura e evitar ultraprocessados, açúcar refinado e refrigerantes. Manter intervalos regulares de 3 a 4 horas entre as refeições.'
  );

  // Inicializa o cálculo ao abrir
  useEffect(() => {
    if (patient) {
      const birth = patient.data_nascimento ? new Date(patient.data_nascimento) : null;
      let age = 30;
      if (birth && !isNaN(birth)) {
        age = new Date().getFullYear() - birth.getFullYear();
      }

      const initialData = {
        peso: patient.peso_inicial || 70,
        alturaCm: patient.altura ? (Number(patient.altura) > 3 ? Number(patient.altura) : Math.round(Number(patient.altura) * 100)) : 168,
        idade: age > 0 ? age : 30,
        sexo: patient.sexo || 'Feminino',
        nivelAtividade: patient.nivel_atividade || 'Moderadamente ativo',
        objetivo: patient.objetivo_texto || (Array.isArray(patient.objetivos) ? patient.objetivos[0] : 'Emagrecimento')
      };

      setMetabolicData(initialData);

      const res = calculateMetabolicNeeds(initialData);
      setCalcResult(res);

      // Escolhe o banco de refeições com base no objetivo
      const objLower = (initialData.objetivo || '').toLowerCase();
      let refList = BANCO_REFEICOES.emagrecimento;
      if (objLower.includes('hipertrofia') || objLower.includes('ganho') || objLower.includes('massa')) {
        refList = BANCO_REFEICOES.hipertrofia;
      } else if (objLower.includes('reeduca') || objLower.includes('saúde')) {
        refList = BANCO_REFEICOES.reeducacao;
      }
      setRefeicoes(refList);
      setPlanoTitulo(`Plano Nutricional - ${initialData.objetivo || 'Personalizado'} (${res.caloriasAlvo} kcal)`);
    }
  }, [patient, isOpen]);

  // Recalcula metas
  const handleRecalculate = () => {
    setCalculating(true);
    setTimeout(() => {
      const res = calculateMetabolicNeeds(metabolicData);
      setCalcResult(res);
      setPlanoTitulo(`Plano Nutricional - ${metabolicData.objetivo || 'Personalizado'} (${res.caloriasAlvo} kcal)`);
      setCalculating(false);
      setStep(2);
    }, 400);
  };

  // Salvar no Neon PostgreSQL
  const handleSaveToNeon = async () => {
    setSaving(true);
    try {
      const payload = {
        titulo: planoTitulo,
        caloriasTotais: calcResult.caloriasAlvo,
        tmb: calcResult.tmb,
        get: calcResult.get,
        proteinas: calcResult.macros.proteinas,
        carboidratos: calcResult.macros.carboidratos,
        gorduras: calcResult.macros.gorduras,
        refeicoes,
        orientacoesGerais: orientacoes
      };

      await savePlanoAlimentar(patient.id, payload, planoTitulo);
      setSuccessToast('Plano alimentar salvo com sucesso no Neon!');
      if (onPlanSaved) onPlanSaved();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      alert('Erro ao salvar plano no Neon: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Compartilhar no WhatsApp
  const handleShareWhatsApp = () => {
    const raw = patient?.whatsapp || patient?.telefone || '';
    const clean = raw.replace(/\D/g, '');
    const nome = patient?.nome?.split(' ')[0] || 'Paciente';

    let msg = `🥗 *${planoTitulo}*\n`;
    msg += `👤 *Paciente:* ${nome}\n`;
    msg += `🔥 *Meta Calórica:* ${calcResult.caloriasAlvo} kcal | Prot: ${calcResult.macros.proteinas}g | Carb: ${calcResult.macros.carboidratos}g | Gord: ${calcResult.macros.gorduras}g\n\n`;
    msg += `📋 *CARDÁPIO DIÁRIO:*\n\n`;

    refeicoes.forEach((r, idx) => {
      msg += `⏰ *${idx + 1}. ${r.nome} (${r.horario})*\n${r.alimentos}\n\n`;
    });

    msg += `💡 *Orientações:* ${orientacoes}`;

    const url = clean ? `https://wa.me/55${clean}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Imprimir / Exportar PDF
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header do Modal com Badge IA */}
        <div className="modal-header">
          <div className="modal-title">
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #dc2626 0%, #ff2b2b 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(220, 38, 38, 0.4)' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <span style={{ fontSize: '19px', fontWeight: '900' }}>Gerador Inteligente de Planos Alimentares IA</span>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                Paciente: <strong>{patient?.nome}</strong> • Algoritmo Metabólico Avançado
              </div>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Indicador de Passos */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
          <button
            className={`chip-select-btn ${step === 1 ? 'selected' : ''}`}
            onClick={() => setStep(1)}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            1. Diagnóstico Metabólico (TMB / GET)
          </button>
          <button
            className={`chip-select-btn ${step === 2 ? 'selected' : ''}`}
            onClick={() => setStep(2)}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            2. Cardápio & Refeições IA
          </button>
          <button
            className={`chip-select-btn ${step === 3 ? 'selected' : ''}`}
            onClick={() => setStep(3)}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            3. Exportar & Salvar
          </button>
        </div>

        {successToast && (
          <div className="alert alert-success" style={{ marginBottom: '18px' }}>
            <CheckCircle2 size={18} />
            <span>{successToast}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 1: CÁLCULO METABÓLICO (TMB, GET, MACROS) */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={{ background: '#fafafa', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '18px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <Calculator size={16} style={{ color: 'var(--primary)' }} /> Parâmetros Antropométricos
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={metabolicData.peso}
                    onChange={(e) => setMetabolicData({ ...metabolicData, peso: e.target.value })}
                    className="form-input"
                    style={{ height: '38px' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Altura (cm)</label>
                  <input
                    type="number"
                    value={metabolicData.alturaCm}
                    onChange={(e) => setMetabolicData({ ...metabolicData, alturaCm: e.target.value })}
                    className="form-input"
                    style={{ height: '38px' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Idade (anos)</label>
                  <input
                    type="number"
                    value={metabolicData.idade}
                    onChange={(e) => setMetabolicData({ ...metabolicData, idade: e.target.value })}
                    className="form-input"
                    style={{ height: '38px' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Nível de Atividade</label>
                  <select
                    value={metabolicData.nivelAtividade}
                    onChange={(e) => setMetabolicData({ ...metabolicData, nivelAtividade: e.target.value })}
                    className="form-input"
                    style={{ height: '38px', padding: '0 10px' }}
                  >
                    <option value="Sedentário">Sedentário (1.2x)</option>
                    <option value="Levemente ativo">Leve (1.37x)</option>
                    <option value="Moderadamente ativo">Moderado (1.55x)</option>
                    <option value="Muito ativo">Intenso (1.72x)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Painel com Resultados do Algoritmo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
              <div className="dash-card-stat" style={{ padding: '16px', background: '#ffffff' }}>
                <div>
                  <div className="dash-stat-title" style={{ fontSize: '11px' }}>Taxa Metabólica Basal (TMB)</div>
                  <div className="dash-stat-number" style={{ fontSize: '22px' }}>{calcResult.tmb} <span style={{ fontSize: '13px' }}>kcal</span></div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mifflin-St Jeor</div>
                </div>
              </div>

              <div className="dash-card-stat" style={{ padding: '16px', background: '#ffffff' }}>
                <div>
                  <div className="dash-stat-title" style={{ fontSize: '11px' }}>Gasto Energético Total (GET)</div>
                  <div className="dash-stat-number" style={{ fontSize: '22px' }}>{calcResult.get} <span style={{ fontSize: '13px' }}>kcal</span></div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Com rotina ativa</div>
                </div>
              </div>

              <div className="dash-card-stat" style={{ padding: '16px', background: '#fef2f2', borderColor: 'var(--primary-border)' }}>
                <div>
                  <div className="dash-stat-title" style={{ fontSize: '11px', color: '#991b1b' }}>Calorias Alvo (Prescrição)</div>
                  <div className="dash-stat-number" style={{ fontSize: '24px', color: 'var(--primary)' }}>{calcResult.caloriasAlvo} <span style={{ fontSize: '13px' }}>kcal</span></div>
                  <div style={{ fontSize: '11px', color: '#991b1b', fontWeight: '700' }}>Com ajuste de meta</div>
                </div>
              </div>
            </div>

            {/* Macros Calculados */}
            <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '18px', marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', marginBottom: '12px' }}>
                Distribuição Recomendada de Macronutrientes
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', textAlign: 'center' }}>
                <div style={{ background: '#fafafa', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>Proteínas</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--primary)' }}>{calcResult.macros.proteinas}g</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>2.0g/kg</div>
                </div>

                <div style={{ background: '#fafafa', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>Carboidratos</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#0284c7' }}>{calcResult.macros.carboidratos}g</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Energia limpa</div>
                </div>

                <div style={{ background: '#fafafa', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>Gorduras Boas</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#d97706' }}>{calcResult.macros.gorduras}g</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>0.85g/kg</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', padding: '0 24px' }}
                onClick={handleRecalculate}
                disabled={calculating}
              >
                <Sparkles size={16} />
                <span>{calculating ? 'Calculando...' : 'Avançar para o Cardápio'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 2: EDIÇÃO E PERSONALIZAÇÃO DO CARDÁPIO */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Título do Plano Nutricional</label>
              <input
                type="text"
                value={planoTitulo}
                onChange={(e) => setPlanoTitulo(e.target.value)}
                className="form-input"
                style={{ fontWeight: '700' }}
              />
            </div>

            {/* Lista de Refeições */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {refeicoes.map((ref, idx) => (
                <div 
                  key={ref.id || idx}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    background: '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: '#09090b', color: '#ffffff', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '10px' }}>
                        {idx + 1}ª
                      </span>
                      <input
                        type="text"
                        value={ref.nome}
                        onChange={(e) => {
                          const updated = [...refeicoes];
                          updated[idx].nome = e.target.value;
                          setRefeicoes(updated);
                        }}
                        style={{ border: 'none', fontWeight: '800', fontSize: '15px', outline: 'none', background: 'transparent' }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        value={ref.horario}
                        onChange={(e) => {
                          const updated = [...refeicoes];
                          updated[idx].horario = e.target.value;
                          setRefeicoes(updated);
                        }}
                        className="form-input"
                        style={{ height: '30px', width: '75px', padding: '0 6px', fontSize: '12px' }}
                      />
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={ref.alimentos}
                    onChange={(e) => {
                      const updated = [...refeicoes];
                      updated[idx].alimentos = e.target.value;
                      setRefeicoes(updated);
                    }}
                    className="form-input"
                    style={{ height: 'auto', fontSize: '13px', resize: 'vertical' }}
                  />
                </div>
              ))}
            </div>

            {/* Orientações Gerais */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Orientações Gerais & Hidratação</label>
              <textarea
                rows={3}
                value={orientacoes}
                onChange={(e) => setOrientacoes(e.target.value)}
                className="form-input"
                style={{ height: 'auto', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <button
                type="button"
                className="btn-icon-secondary"
                onClick={() => setStep(1)}
              >
                Voltar aos Cálculos
              </button>

              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', padding: '0 24px' }}
                onClick={() => setStep(3)}
              >
                <span>Revisar e Exportar</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 3: REVISÃO, WHATSAPP, IMPRESSÃO E SALVAR NO NEON */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '24px', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)' }}>{planoTitulo}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Paciente: {patient?.nome} • Prescrição Nutricional</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--primary)' }}>{calcResult.caloriasAlvo} kcal</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>P: {calcResult.macros.proteinas}g | C: {calcResult.macros.carboidratos}g | G: {calcResult.macros.gorduras}g</div>
                </div>
              </div>

              {/* Lista Formatada de Refeições */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {refeicoes.map((r, i) => (
                  <div key={i} style={{ background: '#fafafa', padding: '12px 16px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '14px' }}>{r.nome}</strong>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>{r.horario}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{r.alimentos}</p>
                  </div>
                ))}
              </div>

              {/* Orientações */}
              <div style={{ background: '#fef2f2', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary-border)' }}>
                <strong style={{ fontSize: '12px', color: '#991b1b', display: 'block', marginBottom: '2px' }}>Orientações:</strong>
                <p style={{ fontSize: '12px', color: '#7f1d1d' }}>{orientacoes}</p>
              </div>
            </div>

            {/* Ações de Exportação e Salvamento */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-icon-secondary"
                onClick={() => setStep(2)}
              >
                Voltar à Edição
              </button>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-icon-secondary"
                  style={{ color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4' }}
                  onClick={handleShareWhatsApp}
                >
                  <Share2 size={15} /> Enviar WhatsApp
                </button>

                <button
                  type="button"
                  className="btn-icon-secondary"
                  onClick={handlePrint}
                >
                  <Printer size={15} /> Imprimir / PDF
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: 'auto', padding: '0 24px' }}
                  onClick={handleSaveToNeon}
                  disabled={saving}
                >
                  <Save size={16} />
                  <span>{saving ? 'Salvando no Neon...' : 'Salvar no Neon'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
