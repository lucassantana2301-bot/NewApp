import React from 'react';
import { Activity, Flame, Utensils } from 'lucide-react';

export default function Logo({ showSubtitle = true, size = 'normal' }) {
  const isLarge = size === 'large';
  
  return (
    <div className="logo-container">
      <div className={`logo-badge ${isLarge ? 'large' : ''}`}>
        <Activity size={isLarge ? 32 : 26} strokeWidth={2.5} />
      </div>
      <div className="logo-text">
        Nutri <span>lucas</span>
      </div>
      {showSubtitle && (
        <div className="logo-subtitle">Sistema de Gestão para Nutricionistas</div>
      )}
    </div>
  );
}
