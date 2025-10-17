import React, { useEffect, useState } from 'react';
import agenceService from '../services/agenceService';

export default function UsersAddModal({ open, onClose, onSubmit, initialValues }) {
  const [formData, setFormData] = useState(initialValues || { username: '', email: '', role: 'Standard', password: '', agenceId: '' });
  const [agences, setAgences] = useState([]);

  useEffect(() => {
    if (open) {
      setFormData(initialValues || { username: '', email: '', role: 'Standard', password: '', agenceId: '' });
      // Charger les agences pour la liste
      agenceService.list().then(setAgences).catch(() => setAgences([]));
    }
  }, [open, initialValues]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-water-100 dark:border-slate-800">
        <div className="px-4 py-3 border-b border-water-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-semibold">{initialValues ? 'Modifier utilisateur' : 'Nouvel utilisateur'}</h3>
          <button onClick={onClose} aria-label="Fermer" className="h-8 w-8 grid place-items-center rounded-lg hover:bg-water-50 dark:hover:bg-slate-800">✕</button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}
          className="p-4 space-y-3"
        >
          <div className="grid grid-cols-1 gap-4">
            <input
              type="text"
              placeholder="Nom d'utilisateur"
              className="border px-3 py-2 rounded-lg"
              value={formData.username || ''}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email"
              className="border px-3 py-2 rounded-lg"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <select
              className="border px-3 py-2 rounded-lg"
              value={formData.role || 'Standard'}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="Standard">Standard</option>
              <option value="Administrateur">Administrateur</option>
            </select>
            {/* Agence: obligatoire pour Standard, optionnel pour Admin */}
            <select
              className="border px-3 py-2 rounded-lg"
              value={formData.agenceId || ''}
              onChange={(e) => setFormData({ ...formData, agenceId: e.target.value })}
              required={formData.role !== 'Administrateur'}
            >
              <option value="">-- Sélectionner une agence --</option>
              {agences.map((a) => (
                <option key={a.AgenceId} value={a.AgenceId}>{a.Nom_Agence}</option>
              ))}
            </select>
            <input
              type="password"
              placeholder="Mot de passe temporaire"
              className="border px-3 py-2 rounded-lg"
              value={formData.password || ''}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <button 
              type="button" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }} 
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-2 rounded-lg transition"
            >
              Annuler
            </button>
            <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl shadow">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}


