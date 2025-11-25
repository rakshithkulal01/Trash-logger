import React from 'react';
import { useNotification } from '../context/NotificationContext';
import './OfflineIndicator.css';

const OfflineIndicator: React.FC = () => {
  const { isOnline } = useNotification();

  if (isOnline) {
    return null;
  }

  return (
    <div className="offline-indicator" role="alert">
      <span className="offline-icon">⚠</span>
      <span className="offline-message">You are offline</span>
    </div>
  );
};

export default OfflineIndicator;
