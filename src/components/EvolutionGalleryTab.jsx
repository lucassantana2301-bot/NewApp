import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Plus, 
  Trash2, 
  Calendar, 
  Scale, 
  Maximize2, 
  CheckCircle2, 
  Sparkles, 
  X,
  Layers,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { fetchFotosEvolucao, createFotoEvolucao, deleteFotoEvolucao } from '../lib/neonClient';

export default function EvolutionGalleryTab({ patientId, currentWeight, initialWeight }) {
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Comparação Antes / Depois selecionados
  const [compareBefore, setCompareBefore] = useState(null);
  const [compareAfter, setCompareAfter] = useState(null);

  // Form de Nova Foto
  const [formData, setFormData] = useState({
    data_foto: new Date().toISOString().split('T')[0],
    tipo: 'Frente',
    url_foto: '',
    peso_momento: currentWeight || '',
    observacoes: ''
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const loadFotos = async () => {
    setLoading(true);
    try {
      if (patientId) {
        const data = await fetchFotosEvolucao(patientId);
        setFotos(data);
        if (data.length >= 2) {
          setCompareBefore(data[data.length - 1]); // Mais antiga
          setCompareAfter(data[0]); // Mais recente
        } else if (data.length === 1) {
          setCompareAfter(data[0]);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar fotos de evolução:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFotos();
  }, [patientId]);

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!formData.url_foto.trim()) {
      alert('Por favor, insira a URL da imagem.');
      return;
    }

    setSaving(true);
    try {
      await createFotoEvolucao({
        paciente_id: patientId,
        ...formData
      });

      setIsModalOpen(false);
      setFormData({
        data_foto: new Date().toISOString().split('T')[0],
        tipo: 'Frente',
        url_foto: '',
        peso_momento: currentWeight || '',
        observacoes: ''
      });
      showToast('Foto de evolução salva com sucesso!');
      await loadFotos();
    } catch (err) {
      alert('Erro ao salvar foto: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir esta foto da galeria?')) return;
    try {
      await deleteFotoEvolucao(id);
      showToast('Foto excluída.');
      await loadFotos();
    } catch (err) {
      alert('Erro ao excluir foto: ' + err.message);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      {toastMsg && (
        <div className="toast-success">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header da Galeria */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={20} style={{ color: 'var(--primary)' }} /> Galeria de Evolução & Comparativo Antes/Depois
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Acompanhe a transformação física e estética do paciente ao longo do tratamento.
          </p>
        </div>

        <button
          className="btn-primary"
          style={{ width: 'auto', padding: '0 20px', height: '42px', fontSize: '13px' }}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={16} /> Adicionar Foto
        </button>
      </div>

      {/* PAINEL DE COMPARAÇÃO ANTES / DEPOIS LADO A LADO */}
      {fotos.length >= 2 && compareBefore && compareAfter && (
        <div 
          style={{
            background: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px',
            marginBottom: '32px',
            color: '#ffffff',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: '#ff2b2b' }} />
              <h3 style={{ fontSize: '17px', fontWeight: '900' }}>Comparativo de Transformação Física</h3>
            </div>
            <span style={{ fontSize: '11px', background: '#dc2626', padding: '3px 10px', borderRadius: '12px', fontWeight: '800' }}>
              RESULTADOS REAIS
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Foto ANTES */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '800', color: '#f87171', fontSize: '13px' }}>ANTES (Início)</span>
                <span style={{ fontSize: '12px', color: '#a1a1aa' }}>
                  {new Date(compareBefore.data_foto).toLocaleDateString('pt-BR')} • {compareBefore.peso_momento} kg
                </span>
              </div>
              <img
                src={compareBefore.url_foto}
                alt="Antes"
                style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
              />
            </div>

            {/* Foto DEPOIS */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '12px', border: '1px solid rgba(220, 38, 38, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '800', color: '#22c55e', fontSize: '13px' }}>DEPOIS (Atual)</span>
                <span style={{ fontSize: '12px', color: '#a1a1aa' }}>
                  {new Date(compareAfter.data_foto).toLocaleDateString('pt-BR')} • {compareAfter.peso_momento} kg
                </span>
              </div>
              <img
                src={compareAfter.url_foto}
                alt="Depois"
                style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Grid de Todas as Fotos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 12px auto' }}></div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Carregando galeria...</p>
        </div>
      ) : fotos.length === 0 ? (
        <div className="empty-state-box" style={{ padding: '60px 20px' }}>
          <Camera size={36} style={{ color: 'var(--primary)', margin: '0 auto 12px auto' }} />
          <div className="empty-state-text" style={{ fontSize: '17px', fontWeight: '800' }}>
            Nenhuma foto de evolução cadastrada
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Adicione registros fotográficos do paciente para comparar resultados ao longo das consultas.
          </p>
          <button
            className="btn-primary"
            style={{ width: 'auto', margin: '14px auto 0 auto', padding: '0 20px', height: '40px' }}
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={15} /> Adicionar Primeira Foto
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '18px' }}>
          {fotos.map((foto) => (
            <div
              key={foto.id}
              style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
                position: 'relative'
              }}
            >
              <img
                src={foto.url_foto}
                alt={foto.tipo}
                style={{ width: '100%', height: '180px', objectFit: 'cover', cursor: 'pointer' }}
                onClick={() => setSelectedPhoto(foto)}
              />

              <div style={{ padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>{foto.tipo}</span>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {foto.peso_momento ? `${foto.peso_momento} kg` : ''}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>{new Date(foto.data_foto).toLocaleDateString('pt-BR')}</span>
                  <button
                    onClick={() => handleDelete(foto.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}
                    title="Excluir foto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Adição de Foto */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <Camera size={20} style={{ color: 'var(--primary)' }} />
                <span>Nova Foto de Evolução</span>
              </div>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit}>
              <div className="form-group">
                <label className="form-label">URL da Imagem / Foto *</label>
                <input
                  type="url"
                  placeholder="https://exemplo.com/foto-paciente.jpg"
                  value={formData.url_foto}
                  onChange={(e) => setFormData({ ...formData, url_foto: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Data da Foto</label>
                  <input
                    type="date"
                    value={formData.data_foto}
                    onChange={(e) => setFormData({ ...formData, data_foto: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ângulo / Posição</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="form-input"
                  >
                    <option value="Frente">Frente</option>
                    <option value="Lado Direito">Lado Direito</option>
                    <option value="Lado Esquerdo">Lado Esquerdo</option>
                    <option value="Costas">Costas</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Peso no Momento (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.peso_momento}
                  onChange={(e) => setFormData({ ...formData, peso_momento: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Observações</label>
                <textarea
                  rows={2}
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="form-input"
                  placeholder="Ex: Redução visível de gordura abdominal..."
                  style={{ height: 'auto', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
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
                  {saving ? 'Salvando...' : 'Salvar Foto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
