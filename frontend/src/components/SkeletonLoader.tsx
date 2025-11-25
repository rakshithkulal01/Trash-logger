import React from 'react';
import './SkeletonLoader.css';

interface SkeletonLoaderProps {
  type?: 'text' | 'card' | 'map' | 'stat';
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type = 'text', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return (
          <div className="skeleton skeleton-text"></div>
        );
      
      case 'card':
        return (
          <div className="skeleton-card">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
          </div>
        );
      
      case 'map':
        return (
          <div className="skeleton-map">
            <div className="skeleton skeleton-map-content"></div>
          </div>
        );
      
      case 'stat':
        return (
          <div className="skeleton-stat">
            <div className="skeleton skeleton-stat-value"></div>
            <div className="skeleton skeleton-stat-label"></div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-wrapper">
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
};

export default SkeletonLoader;
