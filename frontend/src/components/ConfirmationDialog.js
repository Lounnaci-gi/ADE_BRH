import React, { useEffect } from 'react';
import './ConfirmationDialog.css';

const ConfirmationDialog = ({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'Confirmer',
  type = 'success'
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const confirmClass = type === 'danger' ? 'cd-btn-danger' : 'cd-btn-success';

  return (
    <div className="cd-overlay" role="dialog" aria-modal="true" aria-labelledby="cd-title">
      <div className="cd-modal">
        <div className="cd-header">
          <h3 id="cd-title" className="cd-title">{title}</h3>
          <button className="cd-close" aria-label="Fermer" onClick={onClose}>×</button>
        </div>
        <div className="cd-body">
          <p className="cd-message">{message}</p>
        </div>
        <div className="cd-footer">
          <button className="cd-btn cd-btn-ghost" onClick={onClose}>Annuler</button>
          <button className={`cd-btn ${confirmClass}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;


