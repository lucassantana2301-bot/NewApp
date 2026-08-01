import React, { useState, useEffect } from 'react';
import { Settings, Leaf, Database } from 'lucide-react';
import LoginScreen from './components/LoginScreen';
import SignUpScreen from './components/SignUpScreen';
import DashboardScreen from './components/DashboardScreen';
import NeonSettingsModal from './components/NeonSettingsModal';
import { getActiveSession, getNeonDatabaseUrl } from './lib/neonClient';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login' | 'signup' | 'dashboard'
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [configVersion, setConfigVersion] = useState(0);

  useEffect(() => {
    function initSession() {
      setCheckingSession(true);

      const activeUser = getActiveSession();
      if (activeUser) {
        setUser(activeUser);
        setCurrentScreen('dashboard');
      } else {
        setUser(null);
        setCurrentScreen('login');
      }

      setCheckingSession(false);
    }

    initSession();
  }, [configVersion]);

  // Handle successful login
  const handleLoginSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setCurrentScreen('dashboard');
  };

  // Handle successful sign up
  const handleSignUpSuccess = (newUser) => {
    setUser(newUser);
    setCurrentScreen('dashboard');
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('login');
  };

  const dbUrl = getNeonDatabaseUrl();

  if (checkingSession) {
    return (
      <div className="app-viewport">
        <div className="bg-decoration">
          <div className="bg-blob-1"></div>
          <div className="bg-blob-2"></div>
        </div>
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
          <div className="logo-badge large" style={{ margin: '0 auto 16px auto' }}>
            <Leaf size={32} strokeWidth={2.3} />
          </div>
          <div className="spinner" style={{ margin: '0 auto 12px auto', width: '28px', height: '28px', borderTopColor: 'var(--primary)', borderColor: 'var(--primary-border)' }}></div>
          <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Carregando o NutriSystem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-viewport">
      {/* Background blobs */}
      <div className="bg-decoration">
        <div className="bg-blob-1"></div>
        <div className="bg-blob-2"></div>
      </div>

      {/* Top action bar */}
      <div className="top-nav">
        <button
          className="btn-icon-secondary"
          onClick={() => setIsSettingsOpen(true)}
          title="Configurações do Neon PostgreSQL"
        >
          <Database size={15} style={{ color: 'var(--primary)' }} />
          {dbUrl ? 'Neon Conectado' : 'Configurar Neon'}
        </button>
      </div>

      {/* Dynamic Screen rendering */}
      {user || currentScreen === 'dashboard' ? (
        <DashboardScreen
          user={user}
          onLogout={handleLogout}
        />
      ) : currentScreen === 'signup' ? (
        <SignUpScreen
          onNavigateToLogin={() => setCurrentScreen('login')}
          onSignUpSuccess={handleSignUpSuccess}
          openSettings={() => setIsSettingsOpen(true)}
        />
      ) : (
        <LoginScreen
          onNavigateToSignUp={() => setCurrentScreen('signup')}
          onLoginSuccess={handleLoginSuccess}
          openSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* Neon settings modal */}
      <NeonSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigSaved={() => setConfigVersion((v) => v + 1)}
      />
    </div>
  );
}
