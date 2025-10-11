import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import agenceService from '../services/agenceService';

export default function AddAgencyModal({ open, onClose, onSubmit, initialValues }) {
  const [formData, setFormData] = useState({
    FK_Centre: '',
    Nom_Agence: '',
    Adresse: '',
    Telephone: '',
    Email: '',
    Fax: '',
    Nom_Banque: '',
    Compte_Bancaire: '',
    NIF: '',
    NCI: ''
  });
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        FK_Centre: initialValues?.FK_Centre || '',
        Nom_Agence: initialValues?.Nom_Agence || '',
        Adresse: initialValues?.Adresse || '',
        Telephone: initialValues?.Telephone || '',
        Email: initialValues?.Email || '',
        Fax: initialValues?.Fax || '',
        Nom_Banque: initialValues?.Nom_Banque || '',
        Compte_Bancaire: initialValues?.Compte_Bancaire || '',
        NIF: initialValues?.NIF || '',
        NCI: initialValues?.NCI || ''
      });
      loadCentres();
    }
  }, [open, initialValues]);

  const loadCentres = async () => {
    try {
      setLoading(true);
      const data = await agenceService.getCentres();
      setCentres(data);
    } catch (error) {
      console.error('Erreur lors du chargement des centres:', error);
    } finally {
      setLoading(false);
    }
  };


  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-water-100 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-water-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{initialValues ? 'Modifier l’agence' : 'Nouvelle agence'}</h3>
          <button onClick={onClose} aria-label="Fermer" className="h-9 w-9 grid place-items-center rounded-lg hover:bg-water-50 dark:hover:bg-slate-800">✕</button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formData);
          }}
          className="p-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Sélection du centre */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-water-700 dark:text-water-300 mb-2">
                <Building2 className="inline h-4 w-4 mr-2" />
                Centre *
              </label>
              <select
                className="w-full border border-water-300 dark:border-water-600 rounded-lg p-2 bg-white dark:bg-water-700 text-water-900 dark:text-white focus:ring-2 focus:ring-water-500 focus:border-transparent text-sm"
                value={formData.FK_Centre}
                onChange={(e) => setFormData({ ...formData, FK_Centre: e.target.value })}
                required
                disabled={loading}
              >
                <option value="">Sélectionnez un centre</option>
                {centres.map((centre) => (
                  <option key={centre.CentreId} value={centre.CentreId}>
                    {centre.Nom_Centre}
                  </option>
                ))}
              </select>
              {loading && (
                <p className="mt-1 text-sm text-water-500 dark:text-water-400">
                  Chargement des centres...
                </p>
              )}
            </div>

            <input
              type="text"
              placeholder="Nom de l'agence"
              className="border p-2 rounded-lg text-sm"
              value={formData.Nom_Agence}
              onChange={(e) => setFormData({ ...formData, Nom_Agence: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Adresse"
              className="border p-2 rounded-lg text-sm"
              value={formData.Adresse}
              onChange={(e) => setFormData({ ...formData, Adresse: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Téléphone"
              className="border p-2 rounded-lg text-sm"
              value={formData.Telephone}
              onChange={(e) => setFormData({ ...formData, Telephone: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email"
              className="border p-2 rounded-lg text-sm"
              value={formData.Email}
              onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
            />
            <input
              type="text"
              placeholder="Fax"
              className="border p-2 rounded-lg text-sm"
              value={formData.Fax}
              onChange={(e) => setFormData({ ...formData, Fax: e.target.value })}
            />
            <input
              type="text"
              placeholder="Nom de la banque"
              className="border p-2 rounded-lg text-sm"
              value={formData.Nom_Banque}
              onChange={(e) => setFormData({ ...formData, Nom_Banque: e.target.value })}
            />
            <input
              type="text"
              placeholder="Compte bancaire"
              className="border p-2 rounded-lg text-sm"
              value={formData.Compte_Bancaire}
              onChange={(e) => setFormData({ ...formData, Compte_Bancaire: e.target.value })}
            />
            <input
              type="text"
              placeholder="NIF"
              className="border p-2 rounded-lg text-sm"
              value={formData.NIF}
              onChange={(e) => setFormData({ ...formData, NIF: e.target.value })}
            />
            <input
              type="text"
              placeholder="NCI"
              className="border p-2 rounded-lg text-sm"
              value={formData.NCI}
              onChange={(e) => setFormData({ ...formData, NCI: e.target.value })}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition">Annuler</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow">{initialValues ? 'Modifier' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}


