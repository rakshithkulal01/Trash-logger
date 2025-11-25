import React from 'react';
import './StatCard.css';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, subtitle }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        {icon && <span className="stat-card-icon">{icon}</span>}
        <h3 className="stat-card-title">{title}</h3>
      </div>
      <div className="stat-card-value">{value}</div>
      {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
    </div>
  );
};

export default StatCard;
