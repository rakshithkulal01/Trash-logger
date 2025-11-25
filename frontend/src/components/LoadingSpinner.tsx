import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium', message }) => {
  return (
    <div className={`loading-spinner loading-spinner-${size}`} role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true"></div>
      {message && <p className="loading-message">{message}</p>}
      {!message && <span className="sr-only">Loading...</span>}
    </div>
  );
};

export default LoadingSpinner;
