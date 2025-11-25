import React from 'react';
import { TrashType } from '../types';
import './TypeBreakdown.css';

interface TypeBreakdownProps {
  breakdown: Record<TrashType, number>;
}

const TRASH_TYPE_LABELS: Record<TrashType, string> = {
  plastic: 'Plastic',
  glass: 'Glass',
  paper: 'Paper',
  bulky_item: 'Bulky Item',
  hazardous: 'Hazardous',
  other: 'Other',
};

const TRASH_TYPE_COLORS: Record<TrashType, string> = {
  plastic: '#3498db',
  glass: '#2ecc71',
  paper: '#f39c12',
  bulky_item: '#9b59b6',
  hazardous: '#e74c3c',
  other: '#95a5a6',
};

const TypeBreakdown: React.FC<TypeBreakdownProps> = ({ breakdown }) => {
  const total = Object.values(breakdown).reduce((sum, count) => sum + count, 0);
  
  // Sort by count descending
  const sortedTypes = (Object.keys(breakdown) as TrashType[])
    .filter(type => breakdown[type] > 0)
    .sort((a, b) => breakdown[b] - breakdown[a]);

  if (sortedTypes.length === 0) {
    return (
      <div className="type-breakdown">
        <h3 className="type-breakdown-title">Trash Type Breakdown</h3>
        <p className="type-breakdown-empty">No data available</p>
      </div>
    );
  }

  return (
    <div className="type-breakdown">
      <h3 className="type-breakdown-title">Trash Type Breakdown</h3>
      <div className="type-breakdown-list">
        {sortedTypes.map(type => {
          const count = breakdown[type];
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={type} className="type-breakdown-item">
              <div className="type-breakdown-item-header">
                <span 
                  className="type-breakdown-color" 
                  style={{ backgroundColor: TRASH_TYPE_COLORS[type] }}
                />
                <span className="type-breakdown-label">{TRASH_TYPE_LABELS[type]}</span>
                <span className="type-breakdown-count">{count}</span>
              </div>
              <div className="type-breakdown-bar-container">
                <div 
                  className="type-breakdown-bar"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: TRASH_TYPE_COLORS[type]
                  }}
                />
              </div>
              <div className="type-breakdown-percentage">{percentage.toFixed(1)}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TypeBreakdown;
