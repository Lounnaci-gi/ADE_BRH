import React, { useEffect, useState } from 'react';
import { User, Mail, Shield, Building2, Lock, X, UserPlus } from 'lucide-react';
import agenceService from '../services/agenceService';
import '../pages/Login.css';

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
      <div className="relative z-10 login-card" style={{ maxWidth: '420px', width: '100%' }}>
        {/* En-tête avec style login */}
        <div className="login-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{ fontSize: '20px', marginBottom: '4px' }}>
                {initialValues ? 'Modifier utilisateur' : 'Nouvel utilisateur'}
              </h1>
              <p style={{ fontSize: '12px', margin: 0 }}>
                {initialValues ? 'Mise à jour des informations' : 'Création d\'un nouvel utilisateur'}
              </p>
            </div>
            <button 
              onClick={handleClose} 
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors duration-200"
              aria-label="Fermer"
              style={{ color: 'inherit' }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenu du formulaire avec style login */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Nom d'utilisateur */}
          <div className="form-group">
            <label htmlFor="username">Nom d'utilisateur</label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Entrez le nom d'utilisateur"
              required
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Adresse email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="utilisateur@exemple.com"
              required
              disabled={loading}
            />
          </div>

          {/* Rôle */}
          <div className="form-group">
            <label htmlFor="role">Rôle</label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value, agenceId: e.target.value === 'Administrateur' ? '' : formData.agenceId })}
              disabled={loading}
            >
              <option value="Standard">👤 Utilisateur Standard</option>
              <option value="Administrateur">👑 Administrateur</option>
            </select>
          </div>

          {/* Agence */}
          <div className="form-group">
            <label htmlFor="agenceId">
              Agence {formData.role !== 'Administrateur' && '*'}
            </label>
            <select
              id="agenceId"
              value={formData.agenceId}
              onChange={(e) => setFormData({ ...formData, agenceId: e.target.value })}
              required={formData.role !== 'Administrateur'}
              disabled={formData.role === 'Administrateur' || loading}
            >
              <option value="">-- Sélectionner une agence --</option>
              {agences.map((a) => (
                <option key={a.AgenceId} value={a.AgenceId}>{a.Nom_Agence}</option>
              ))}
            </select>
          </div>

          {/* Mot de passe */}
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Définissez un mot de passe sécurisé"
              required
              disabled={loading}
            />
          </div>

          {/* Bouton de soumission */}
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Enregistrement...' : (initialValues ? 'Mettre à jour' : 'Créer l\'utilisateur')}
          </button>
        </form>

        {/* Footer avec style login */}
        <div className="login-footer">
          <p>Remplissez tous les champs requis</p>
        </div>
      </div>
    </div>
  );
}


