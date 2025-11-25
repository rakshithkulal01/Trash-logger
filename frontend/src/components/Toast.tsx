import React, { useEffect } from 'react';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 5000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  };

  return (
    <div className={`toast toast-${type}`} role="alert">
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-message">{message}</span>
      <button
        className="toast-close"
        onClick={() => onClose(id)}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
};

export default Toast;
