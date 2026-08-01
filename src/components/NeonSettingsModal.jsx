import React, { useState } from 'react';
import { Database, X, Link as LinkIcon, RefreshCw, Key } from 'lucide-react';
import { getNeonDatabaseUrl, saveNeonDatabaseUrl, getSql } from '../lib/neonClient';

export default function NeonSettingsModal({ isOpen, onClose, onConfigSaved }) {
  const [dbUrl, setDbUrl] = useState(getNeonDatabaseUrl());
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    saveNeonDatabaseUrl(dbUrl);
    if (onConfigSaved) onConfigSaved();
    onClose();
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestStatus(null);
    try {
      saveNeonDatabaseUrl(dbUrl);
      const sql = getSql();
      if (!sql) {
        setTestStatus({ success: false, message: 'Insira uma URL de conexão PostgreSQL válida.' });
        return;
      }
      
      const result = await sql`SELECT NOW() as now, current_database() as db;`;
      if (result && result.length > 0) {
        setTestStatus({
          success: true,
          message: `Conexão efetuada com sucesso no Neon! Banco: ${result[0].db}`,
        });
      }
    } catch (err) {
      setTestStatus({ success: false, message: `Erro ao conectar no Neon: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Database size={20} style={{ color: 'var(--primary)' }} />
            Configuração do Neon PostgreSQL
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Conectado ao projeto <strong>nutricionista_sistema</strong> no Neon PostgreSQL.
        </p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* DATABASE URL */}
          <div className="form-group">
            <label className="form-label">Neon PostgreSQL Connection String</label>
            <div className="input-wrapper">
              <LinkIcon className="input-icon" size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="postgresql://user:pass@ep-xyz.aws.neon.tech/neondb?sslmode=require"
                value={dbUrl}
                onChange={(e) => setDbUrl(e.target.value)}
                required
              />
            </div>
          </div>

          {testStatus && (
            <div
              className={`alert-box ${testStatus.success ? 'alert-success' : 'alert-error'}`}
              style={{ margin: '4px 0' }}
            >
              {testStatus.message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              className="btn-icon-secondary"
              onClick={handleTestConnection}
              disabled={testing}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <RefreshCw size={14} className={testing ? 'spinner' : ''} />
              Testar Conexão
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1, marginTop: 0, height: '42px', fontSize: '13px' }}>
              Salvar Conexão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
