import React from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
  progress: number; // 0-100
  message?: string;
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  message, 
  showPercentage = true 
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="progress-bar-container" role="region" aria-label="Upload progress">
      {message && <p className="progress-message" id="progress-message">{message}</p>}
      <div className="progress-bar">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${Math.round(clampedProgress)}% complete`}
          aria-describedby={message ? 'progress-message' : undefined}
        >
          {showPercentage && (
            <span className="progress-percentage" aria-hidden="true">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
