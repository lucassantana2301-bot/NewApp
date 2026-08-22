import React, { useState, useEffect } from 'react';
import { 
  Droplet, 
  CheckCircle2, 
  Circle, 
  Utensils, 
  Flame, 
  TrendingDown, 
  Calendar, 
  Activity, 
  ArrowLeft, 
  Sparkles, 
  Smile, 
  Plus, 
  Minus,
  MessageCircle,
  Clock
} from 'lucide-react';
import { fetchRegistroHabitos, saveRegistroHabitos, fetchPlanosAlimentares } from '../lib/neonClient';

export default function PatientPortalView({ patient, onBack }) {
  const [registro, setRegistro] = useState({
    copos_agua: 4,
    meta_agua_ml: 2500,
    refeicoes_concluidas: []
  });
  const [planoAtual, setPlanoAtual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingWater, setSavingWater] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Carregar dados diários do paciente
  useEffect(() => {
    async function loadPortalData() {
      if (!patient?.id) return;
      setLoading(true);
      try {
        const [habitos, planos] = await Promise.all([
          fetchRegistroHabitos(patient.id, todayStr),
          fetchPlanosAlimentares(patient.id)
        ]);

        if (habitos) {
          setRegistro(habitos);
        } else {
          setRegistro({
            copos_agua: 4,
            meta_agua_ml: 2500,
            refeicoes_concluidas: []
          });
        }

        if (planos && planos.length > 0) {
          setPlanoAtual(planos[0]);
        }
      } catch (err) {
        console.error('Erro ao carregar portal do paciente:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPortalData();
  }, [patient?.id, todayStr]);

  // Atualizar ingestão de água (+250ml por copo)
  const handleUpdateWater = async (delta) => {
    const novosCopos = Math.max(0, (registro.copos_agua || 0) + delta);
    const updated = {
      ...registro,
      copos_agua: novosCopos
    };
    setRegistro(updated);

    try {
      setSavingWater(true);
      await saveRegistroHabitos(patient.id, {
        data: todayStr,
        copos_agua: novosCopos,
        meta_agua_ml: registro.meta_agua_ml || 2500,
        refeicoes_concluidas: registro.refeicoes_concluidas
      });
      if (delta > 0) showToast('+250ml de água registrado!');
    } catch (err) {
      console.error('Erro ao salvar água:', err);
    } finally {
      setSavingWater(false);
    }
  };

  // Marcar/desmarcar refeição concluída
  const handleToggleMeal = async (mealId) => {
    const current = Array.isArray(registro.refeicoes_concluidas) ? [...registro.refeicoes_concluidas] : [];
    let updatedMeals;
    if (current.includes(mealId)) {
      updatedMeals = current.filter(id => id !== mealId);
    } else {
      updatedMeals = [...current, mealId];
      showToast('Refeição cumprida com sucesso! 👏');
    }

    const updated = {
      ...registro,
      refeicoes_concluidas: updatedMeals
    };
    setRegistro(updated);

    try {
      await saveRegistroHabitos(patient.id, {
        data: todayStr,
        copos_agua: registro.copos_agua,
        meta_agua_ml: registro.meta_agua_ml || 2500,
        refeicoes_concluidas: updatedMeals
      });
    } catch (err) {
      console.error('Erro ao salvar refeição:', err);
    }
  };

  // Parsing do Plano Alimentar
  let refeicoesList = [];
  if (planoAtual?.conteudo) {
    if (Array.isArray(planoAtual.conteudo.refeicoes)) {
      refeicoesList = planoAtual.conteudo.refeicoes;
    } else if (Array.isArray(planoAtual.conteudo)) {
      refeicoesList = planoAtual.conteudo;
    }
  }

  // Fallback caso não haja plano salvo
  if (refeicoesList.length === 0) {
    refeicoesList = [
      { id: 'cafe', nome: 'Café da Manhã', horario: '07:30', alimentos: '2 ovos mexidos + 1 fatia de pão integral + café sem açúcar' },
      { id: 'almoco', nome: 'Almoço', horario: '12:30', alimentos: '140g frango grelhado + 100g arroz integral + feijão e salada à vontade' },
      { id: 'lanche', nome: 'Lanche da Tarde', horario: '16:30', alimentos: '1 iogurte natural + 1 fruta + 15g de castanhas' },
      { id: 'jantar', nome: 'Jantar', horario: '20:00', alimentos: '140g peixe ou patinho + legumes no vapor' }
    ];
  }

  const mlTotal = (registro.copos_agua || 0) * 250;
  const metaMl = registro.meta_agua_ml || 2500;
  const aguaPercent = Math.min(100, Math.round((mlTotal / metaMl) * 100));

  const totalRefeicoes = refeicoesList.length;
  const refeicoesFeitas = (registro.refeicoes_concluidas || []).length;
  const refeicoesPercent = totalRefeicoes > 0 ? Math.round((refeicoesFeitas / totalRefeicoes) * 100) : 0;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.25s ease' }}>
      {toastMsg && (
        <div className="toast-success">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header do Portal com Botão Voltar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button
          className="btn-icon-secondary"
          onClick={onBack}
        >
          <ArrowLeft size={16} /> Voltar ao Painel Clínico
        </button>

        <span style={{ fontSize: '12px', fontWeight: '800', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px 12px', borderRadius: '16px' }}>
          📱 Visualização do Paciente (Simulação Interativa)
        </span>
      </div>

      {/* Cartão de Boas-Vindas do Paciente */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          marginBottom: '24px',
          border: '1px solid #27272a',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '22px' }}>👋</span>
            <h2 style={{ fontSize: '22px', fontWeight: '900' }}>Olá, {patient?.nome?.split(' ')[0]}!</h2>
          </div>
          <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '520px' }}>
            Acompanhe o seu plano diário, marque as refeições concluídas e mantenha sua hidratação em dia!
          </p>

          <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: '700' }}>Meta Calórica Diária</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#ff2b2b' }}>
                {planoAtual?.conteudo?.caloriasTotais || 1750} kcal
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: '700' }}>Adesão da Dieta Hoje</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#22c55e' }}>
                {refeicoesPercent}% ({refeicoesFeitas}/{totalRefeicoes})
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: '700' }}>Hidratação Atual</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#06b6d4' }}>
                {mlTotal} ml ({aguaPercent}%)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Interativo de Hidratação (Tracker de Água) */}
      <div 
        className="dash-card-full"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)',
          border: '1px solid #99f6e4',
          padding: '24px',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#06b6d4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)' }}>
              <Droplet size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '900', color: 'var(--text-main)' }}>Contador Diário de Água</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Meta recomendada: {metaMl}ml ({metaMl / 250} copos de 250ml)</p>
            </div>
          </div>

          {/* Controles de + e - */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn-icon-secondary"
              style={{ width: '38px', height: '38px', padding: 0, justifyContent: 'center' }}
              onClick={() => handleUpdateWater(-1)}
              disabled={savingWater || (registro.copos_agua || 0) <= 0}
            >
              <Minus size={16} />
            </button>

            <span style={{ fontSize: '18px', fontWeight: '900', minWidth: '80px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}>
              {registro.copos_agua || 0} copos
            </span>

            <button
              className="btn-primary"
              style={{ width: 'auto', padding: '0 16px', height: '38px', fontSize: '13px', background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', boxShadow: '0 0 14px rgba(6,182,212,0.4)' }}
              onClick={() => handleUpdateWater(1)}
              disabled={savingWater}
            >
              <Plus size={16} /> +250ml
            </button>
          </div>
        </div>

        {/* Barra de Progresso de Água */}
        <div style={{ width: '100%', height: '14px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
          <div
            style={{
              width: `${aguaPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #06b6d4 0%, #0284c7 100%)',
              borderRadius: '10px',
              transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 0 10px rgba(6, 182, 212, 0.6)'
            }}
          />
        </div>
      </div>

      {/* Checklist Diário de Refeições */}
      <div className="dash-card-full" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Utensils size={20} style={{ color: 'var(--primary)' }} /> Checklist das Refeições de Hoje
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Toque no círculo para marcar cada refeição consumida.
            </p>
          </div>

          <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--primary)', background: '#fef2f2', padding: '4px 12px', borderRadius: '14px' }}>
            {refeicoesFeitas} de {totalRefeicoes} concluídas
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {refeicoesList.map((ref, idx) => {
            const isCompleted = (registro.refeicoes_concluidas || []).includes(ref.id || `ref_${idx}`);

            return (
              <div
                key={ref.id || idx}
                onClick={() => handleToggleMeal(ref.id || `ref_${idx}`)}
                style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${isCompleted ? '#bbf7d0' : 'var(--border)'}`,
                  background: isCompleted ? '#f0fdf4' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Ícone de Checkbox Interativo */}
                <div style={{ marginTop: '2px' }}>
                  {isCompleted ? (
                    <CheckCircle2 size={24} style={{ color: '#16a34a' }} />
                  ) : (
                    <Circle size={24} style={{ color: '#cbd5e1' }} />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: isCompleted ? '#166534' : 'var(--text-main)', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                      {ref.nome}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: isCompleted ? '#16a34a' : 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {ref.horario}
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', color: isCompleted ? '#15803d' : 'var(--text-muted)', lineHeight: '1.4' }}>
                    {ref.alimentos}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
