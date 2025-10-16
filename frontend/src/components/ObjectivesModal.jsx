import React, { useEffect, useState } from 'react';
import { X, Building2, Calendar } from 'lucide-react';
import objectivesService from '../services/objectivesService';

export default function ObjectivesModal({ open, onClose, onSubmit, initialValues, agences = [] }) {
  const [formData, setFormData] = useState({
    agenceId: '',
    annee: new Date().getFullYear(),
    mois: new Date().getMonth() + 1,
    objectif_Coupures: '',
    objectif_Dossiers_Juridiques: '',
    objectif_MisesEnDemeure_Envoyees: '',
    objectif_Relances_Envoyees: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      if (initialValues) {
        setFormData({
          agenceId: initialValues.AgenceId || '',
          annee: initialValues.Annee || new Date().getFullYear(),
          mois: initialValues.Mois || (new Date().getMonth() + 1),
          objectif_Coupures: initialValues.Obj_Coupures ?? '',
          objectif_Dossiers_Juridiques: initialValues.Obj_Dossiers_Juridiques ?? '',
          objectif_MisesEnDemeure_Envoyees: initialValues.Obj_MisesEnDemeure_Envoyees ?? '',
          objectif_Relances_Envoyees: initialValues.Obj_Relances_Envoyees ?? ''
        });
      } else {
        setFormData({
          agenceId: '',
          annee: new Date().getFullYear(),
          mois: new Date().getMonth() + 1,
          objectif_Coupures: '',
          objectif_Dossiers_Juridiques: '',
          objectif_MisesEnDemeure_Envoyees: '',
          objectif_Relances_Envoyees: ''
        });
      }
    }
  }, [open, initialValues]);

  const getMonthName = (m) => [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ][m - 1] || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.agenceId || !formData.annee || !formData.mois) {
      setError('Agence, Année et Mois sont requis');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        agenceId: parseInt(formData.agenceId, 10),
        annee: parseInt(formData.annee, 10),
        mois: parseInt(formData.mois, 10),
        objectif_Coupures: formData.objectif_Coupures ? parseInt(formData.objectif_Coupures, 10) : null,
        objectif_Dossiers_Juridiques: formData.objectif_Dossiers_Juridiques ? parseInt(formData.objectif_Dossiers_Juridiques, 10) : null,
        objectif_MisesEnDemeure_Envoyees: formData.objectif_MisesEnDemeure_Envoyees ? parseInt(formData.objectif_MisesEnDemeure_Envoyees, 10) : null,
        objectif_Relances_Envoyees: formData.objectif_Relances_Envoyees ? parseInt(formData.objectif_Relances_Envoyees, 10) : null
      });
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erreur lors de l\'enregistrement';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-xl border">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {initialValues ? 'Modifier les objectifs' : 'Ajouter des objectifs'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="m-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Agence</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={formData.agenceId}
                onChange={(e) => setFormData({ ...formData, agenceId: e.target.value })}
                required
                disabled={!!initialValues}
              >
                <option value="">Sélectionner une agence</option>
                {agences.map((a) => (
                  <option key={a.AgenceId} value={a.AgenceId}>{a.Nom_Agence}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mois</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={formData.mois}
                  onChange={(e) => setFormData({ ...formData, mois: parseInt(e.target.value, 10) })}
                  required
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{getMonthName(m)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Année</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={formData.annee}
                  onChange={(e) => setFormData({ ...formData, annee: parseInt(e.target.value, 10) })}
                  required
                >
                  {Array.from({ length: 11 }, (_, i) => 2020 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Coupures</label>
              <input type="number" className="w-full border rounded px-3 py-2" value={formData.objectif_Coupures}
                     onChange={(e) => setFormData({ ...formData, objectif_Coupures: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dossiers Juridiques</label>
              <input type="number" className="w-full border rounded px-3 py-2" value={formData.objectif_Dossiers_Juridiques}
                     onChange={(e) => setFormData({ ...formData, objectif_Dossiers_Juridiques: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mises en Demeure</label>
              <input type="number" className="w-full border rounded px-3 py-2" value={formData.objectif_MisesEnDemeure_Envoyees}
                     onChange={(e) => setFormData({ ...formData, objectif_MisesEnDemeure_Envoyees: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Relances</label>
              <input type="number" className="w-full border rounded px-3 py-2" value={formData.objectif_Relances_Envoyees}
                     onChange={(e) => setFormData({ ...formData, objectif_Relances_Envoyees: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200">Annuler</button>
            <button type="submit" disabled={loading} className="px-5 py-2 rounded bg-blue-600 text-white">
              {loading ? 'Enregistrement...' : (initialValues ? 'Mettre à jour' : 'Enregistrer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


