import React, { useEffect, useState } from 'react';
import { User, Mail, Shield, Building2, Lock, X, Save, UserPlus } from 'lucide-react';
import agenceService from '../services/agenceService';

export default function UsersAddModal({ open, onClose, onSubmit, initialValues }) {
  const [formData, setFormData] = useState({ username: '', email: '', role: 'Standard', password: '', agenceId: '' });
  const [agences, setAgences] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fonction pour réinitialiser le formulaire
  const resetForm = () => {
    setFormData({ username: '', email: '', role: 'Standard', password: '', agenceId: '' });
  };

  useEffect(() => {
    if (open) {
      // Réinitialiser le formulaire à chaque ouverture
      if (initialValues) {
        // Mode édition - pré-remplir avec les valeurs existantes
        console.log('Mode édition - Pré-remplissage avec:', initialValues);
        setFormData({
          username: initialValues.username || '',
          email: initialValues.email || '',
          role: initialValues.role || 'Standard',
          password: '', // Ne pas pré-remplir le mot de passe
          agenceId: initialValues.agenceId || ''
        });
      } else {
        // Mode création - vider complètement le formulaire
        console.log('Mode création - Formulaire vidé');
        setFormData({ 
          username: '', 
          email: '', 
          role: 'Standard', 
          password: '', 
          agenceId: '' 
        });
      }
      
      // Charger les agences pour la liste
      setLoading(true);
      agenceService.list()
        .then(setAgences)
        .catch(() => setAgences([]))
        .finally(() => setLoading(false));
    }
  }, [open, initialValues]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Réinitialiser le formulaire avant de fermer
    setFormData({ 
      username: '', 
      email: '', 
      role: 'Standard', 
      password: '', 
      agenceId: '' 
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-blue-100">
        {/* En-tête avec thème du site */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {initialValues ? 'Modifier utilisateur' : 'Nouvel utilisateur'}
            </h3>
            <button 
              onClick={handleClose} 
              className="p-1 hover:bg-white/20 rounded transition-colors duration-200"
              aria-label="Fermer"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Contenu du formulaire */}
        <div className="p-3">
          <form onSubmit={handleSubmit} className="space-y-2">
            {/* Section Informations de base */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-1 gap-1.5">
                {/* Nom d'utilisateur */}
                <div className="space-y-1">
                  <label className="flex items-center text-xs font-semibold text-gray-700">
                    <div className="p-1 bg-blue-100 rounded mr-2">
                      <User className="h-3 w-3 text-blue-600" />
                    </div>
                    Nom d'utilisateur *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md text-sm"
                    placeholder="Entrez le nom d'utilisateur"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="flex items-center text-xs font-semibold text-gray-700">
                    <div className="p-1 bg-green-100 rounded mr-2">
                      <Mail className="h-3 w-3 text-green-600" />
                    </div>
                    Adresse email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md text-sm"
                    placeholder="utilisateur@exemple.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section Rôle et Agence */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-1 gap-1.5">
                {/* Rôle */}
                <div className="space-y-1">
                  <label className="flex items-center text-xs font-semibold text-gray-700">
                    <div className="p-1 bg-orange-100 rounded mr-2">
                      <Shield className="h-3 w-3 text-orange-600" />
                    </div>
                    Rôle *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value, agenceId: e.target.value === 'Administrateur' ? '' : formData.agenceId })}
                    className="w-full border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md text-sm"
                  >
                    <option value="Standard">👤 Utilisateur Standard</option>
                    <option value="Administrateur">👑 Administrateur</option>
                  </select>
                </div>

                {/* Agence */}
                <div className="space-y-1">
                  <label className="flex items-center text-xs font-semibold text-gray-700">
                    <div className="p-1 bg-purple-100 rounded mr-2">
                      <Building2 className="h-3 w-3 text-purple-600" />
                    </div>
                    Agence {formData.role !== 'Administrateur' && '*'}
                  </label>
                  <select
                    value={formData.agenceId}
                    onChange={(e) => setFormData({ ...formData, agenceId: e.target.value })}
                    className="w-full border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md text-sm"
                    required={formData.role !== 'Administrateur'}
                    disabled={formData.role === 'Administrateur'}
                  >
                    <option value="">-- Sélectionner une agence --</option>
                    {agences.map((a) => (
                      <option key={a.AgenceId} value={a.AgenceId}>{a.Nom_Agence}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section Sécurité */}
            <div className="space-y-1.5">
              <div className="space-y-1">
                <label className="flex items-center text-xs font-semibold text-gray-700">
                  <div className="p-1 bg-red-100 rounded mr-2">
                    <Lock className="h-3 w-3 text-red-600" />
                  </div>
                  Mot de passe *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md text-sm"
                  placeholder="Définissez un mot de passe sécurisé"
                  required
                />
                
                {/* Note de sécurité */}
                <div className="bg-red-50 border border-red-200 rounded p-1">
                  <div className="flex items-start gap-1">
                    <Lock className="h-2.5 w-2.5 text-red-600 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-semibold text-red-800">Conseils de sécurité</h5>
                      <p className="text-xs text-red-700">
                        Min. 8 caractères avec majuscules, minuscules, chiffres et symboles.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-1.5 pt-2 border-t border-gray-200">
              <button 
                type="button" 
                onClick={handleClose}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded shadow-sm hover:shadow-md transition-all duration-200 inline-flex items-center gap-1 font-medium text-xs"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded shadow-md hover:shadow-lg transition-all duration-200 inline-flex items-center gap-1 font-medium text-xs"
              >
                <UserPlus className="h-3 w-3" />
                {loading ? 'Enregistrement...' : (initialValues ? 'Mettre à jour' : 'Créer l\'utilisateur')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


