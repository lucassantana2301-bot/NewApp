import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, UserPlus } from 'lucide-react';
import Logo from './Logo';
import { registerNutricionista, getNeonDatabaseUrl } from '../lib/neonClient';

export default function SignUpScreen({ onNavigateToLogin, onSignUpSuccess, openSettings }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!nome.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor, crie uma senha.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem. Digite a mesma senha nos dois campos.');
      return;
    }

    const dbUrl = getNeonDatabaseUrl();
    if (!dbUrl) {
      setErrorMessage('A URL de conexão do Neon PostgreSQL não está configurada.');
      if (openSettings) openSettings();
      return;
    }

    setLoading(true);

    try {
      // Regra importante: Salvar o nome e email na tabela `nutricionistas` do Neon PostgreSQL!
      const user = await registerNutricionista({
        nome: nome.trim(),
        email: email.trim(),
        password: password,
      });

      setSuccessMessage('Conta criada com sucesso no Neon PostgreSQL! Redirecionando...');

      setTimeout(() => {
        onSignUpSuccess(user);
      }, 1200);
    } catch (err) {
      setErrorMessage(err.message || 'Erro ao realizar cadastro no Neon.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card-container">
      <div className="auth-card">
        {/* Logo NutriSystem */}
        <Logo size="large" />

        <div className="auth-header">
          <h2 className="auth-title">Criar sua conta</h2>
          <p className="auth-desc">Cadastro de nutricionista no banco <strong>Neon PostgreSQL</strong></p>
        </div>

        {errorMessage && (
          <div className="alert-box alert-error" style={{ marginBottom: '18px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="alert-box alert-success" style={{ marginBottom: '18px' }}>
            <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>{successMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Nome Completo */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-nome">
              Nome completo
            </label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input
                id="signup-nome"
                type="text"
                className="form-input"
                placeholder="Dra. Ana Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
          </div>

          {/* E-mail */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">
              E-mail profissional
            </label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                id="signup-email"
                type="email"
                className="form-input"
                placeholder="ana.silva@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Senha */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">
              Senha (mínimo 6 caracteres)
            </label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input has-right-icon"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="input-right-action"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirmar Senha */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-confirm-password">
              Confirmar senha
            </label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input has-right-icon"
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="input-right-action"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Criar Conta Button */}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner"></div>
                Salvando no Neon...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Criar conta
              </>
            )}
          </button>
        </form>

        {/* Link Faça Login */}
        <div className="auth-footer">
          Já tem conta?
          <button
            type="button"
            className="auth-link"
            onClick={onNavigateToLogin}
          >
            Faça login
          </button>
        </div>
      </div>
    </div>
  );
}
