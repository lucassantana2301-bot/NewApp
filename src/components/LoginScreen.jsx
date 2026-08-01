import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, LogIn, Database } from 'lucide-react';
import Logo from './Logo';
import { loginNutricionista, getNeonDatabaseUrl } from '../lib/neonClient';

export default function LoginScreen({ onNavigateToSignUp, onLoginSuccess, openSettings }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
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
      // Login direto na tabela nutricionistas do Neon PostgreSQL
      const user = await loginNutricionista({
        email: email.trim(),
        password: password,
      });

      if (user) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Erro ao realizar login no Neon.');
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
          <h2 className="auth-title">Acessar a sua conta</h2>
          <p className="auth-desc">Autenticação nativa via <strong>Neon PostgreSQL</strong></p>
        </div>

        {errorMessage && (
          <div className="alert-box alert-error" style={{ marginBottom: '18px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Email Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              E-mail profissional
            </label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Senha
            </label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input has-right-icon"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-right-action"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Entrar Button */}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner"></div>
                Autenticando no Neon...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Entrar
              </>
            )}
          </button>
        </form>

        {/* Link Cadastre-se */}
        <div className="auth-footer">
          Não tem conta?
          <button
            type="button"
            className="auth-link"
            onClick={onNavigateToSignUp}
          >
            Cadastre-se
          </button>
        </div>
      </div>
    </div>
  );
}
