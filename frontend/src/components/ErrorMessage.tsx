import React from 'react';
import './ErrorMessage.css';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  type?: 'error' | 'warning' | 'info';
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  onRetry,
  retryLabel = 'Try Again',
  type = 'error',
}) => {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return '⚠️';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ️';
      default:
        return '⚠️';
    }
  };

  const getAriaLabel = () => {
    switch (type) {
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Information';
      default:
        return 'Error';
    }
  };

  return (
    <div className={`error-message-container error-message-${type}`} role="alert" aria-live="assertive">
      <div className="error-message-icon" aria-label={getAriaLabel()} role="img">{getIcon()}</div>
      <div className="error-message-content">
        {title && <h3 className="error-message-title">{title}</h3>}
        <p className="error-message-text">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="error-message-retry" aria-label={`${retryLabel} - ${message}`}>
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
