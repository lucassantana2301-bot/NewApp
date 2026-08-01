import React from 'react';
import { Activity, Leaf } from 'lucide-react';

export default function Logo({ showSubtitle = true, size = 'normal' }) {
  const isLarge = size === 'large';
  
  return (
    <div className="logo-container">
      <div className={`logo-badge ${isLarge ? 'large' : ''}`}>
        <Leaf size={isLarge ? 32 : 28} strokeWidth={2.3} />
      </div>
      <div className="logo-text">
        Nutri<span>System</span>
      </div>
      {showSubtitle && (
        <div className="logo-subtitle">Sistema de Gestão para Nutricionistas</div>
      )}
    </div>
  );
}
