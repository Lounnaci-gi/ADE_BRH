import React, { useEffect, useState } from 'react';

export default function UsersAddModal({ open, onClose, onSubmit }) {
  const [formData, setFormData] = useState({ username: '', email: '', role: 'user', password: '' });

  useEffect(() => {
    if (open) setFormData({ username: '', email: '', role: 'user', password: '' });
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-water-100 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-water-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Nouvel utilisateur</h3>
          <button onClick={onClose} aria-label="Fermer" className="h-9 w-9 grid place-items-center rounded-lg hover:bg-water-50 dark:hover:bg-slate-800">✕</button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}
          className="p-6 space-y-4"
        >
          <div className="grid grid-cols-1 gap-4">
            <input
              type="text"
              placeholder="Nom d'utilisateur"
              className="border p-2 rounded-lg"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email"
              className="border p-2 rounded-lg"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <select
              className="border p-2 rounded-lg"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
            </select>
            <input
              type="password"
              placeholder="Mot de passe temporaire"
              className="border p-2 rounded-lg"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition">Annuler</button>
            <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-xl shadow">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}


