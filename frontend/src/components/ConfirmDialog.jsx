import React from 'react';
import { AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';
import Modal from './Modal';

function ConfirmDialog({
  isOpen,
  title = 'Confirmation',
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
  tone = 'danger', // 'danger' | 'primary' | 'success'
}) {
  const toneStyles = {
    danger: {
      icon: <Trash2 className="h-5 w-5 text-red-600" />,
      button: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-600',
      subtle: 'text-red-700',
      badge: 'bg-red-50 text-red-700 ring-1 ring-red-100',
    },
    primary: {
      icon: <AlertTriangle className="h-5 w-5 text-blue-600" />,
      button: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-600',
      subtle: 'text-blue-700',
      badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
    },
    success: {
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
      button: 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-600',
      subtle: 'text-emerald-700',
      badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    },
  };

  const { icon, button, subtle, badge } = toneStyles[tone] || toneStyles.primary;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      headerIcon={icon}
      size="sm"
      footer={(
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-white ${button} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white`}
          >
            {confirmLabel}
          </button>
        </div>
      )}
    >
      <div className="space-y-2">
        {message && (
          <p className="text-slate-700 leading-relaxed">{message}</p>
        )}
        <div className={`inline-flex items-center gap-2 text-sm ${badge} px-2.5 py-1 rounded-full`}> 
          {icon}
          <span className={subtle}>Action requise</span>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
