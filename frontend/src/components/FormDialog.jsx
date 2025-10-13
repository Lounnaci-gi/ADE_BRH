import React from 'react';
import { Save, PlusCircle, Pencil } from 'lucide-react';
import Modal from './Modal';

function FormDialog({
  isOpen,
  title,
  description,
  submitLabel = 'Enregistrer',
  cancelLabel = 'Annuler',
  onSubmit,
  onCancel,
  submitting = false,
  icon = null,
  children,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      headerIcon={icon}
      size="md"
      footer={(
        <div className="flex items-center justify-between gap-3">
          {description && (
            <p className="text-sm text-slate-500">{description}</p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              disabled={submitting}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              onClick={onSubmit}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              {submitting ? 'Enregistrement...' : submitLabel}
            </button>
          </div>
        </div>
      )}
    >
      <div className="space-y-4">
        {children}
      </div>
    </Modal>
  );
}

export default FormDialog;
