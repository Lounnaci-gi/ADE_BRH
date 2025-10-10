import React, { useEffect } from 'react';

export default function Toast({ open, type = 'success', message, onClose, duration = 3000 }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open) return null;

  const color = type === 'success' ? 'bg-green-600' : 'bg-red-600';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className={`${color} text-white px-4 py-2 rounded-lg shadow-lg min-w-[280px] text-center`}>
        {message}
      </div>
    </div>
  );
}


