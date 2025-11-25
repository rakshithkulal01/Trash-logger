import React from 'react';
import LogTrashForm from '../components/LogTrashForm';
import './Views.css';

const LogView: React.FC = () => {
  return (
    <div className="view-container">
      <h2 className="view-title">Log Trash</h2>
      <div className="view-content">
        <LogTrashForm />
      </div>
    </div>
  );
};

export default LogView;
