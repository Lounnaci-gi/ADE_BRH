import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Phone, Mail, FileText } from 'lucide-react';
import agenceService from '../services/agenceService';
import '../pages/Login.css';

export default function AddAgencyModal({ open, onClose, onSubmit, initialValues }) {
  const [formData, setFormData] = useState({
    FK_Centre: '',
    Nom_Agence: '',
    Adresse: '',
    Telephone: '',
    Email: '',
    Fax: ''
  });
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setFormData({
        FK_Centre: initialValues?.FK_Centre || '',
        Nom_Agence: initialValues?.Nom_Agence || '',
        Adresse: initialValues?.Adresse || '',
        Telephone: initialValues?.Telephone || '',
        Email: initialValues?.Email || '',
        Fax: initialValues?.Fax || ''
      });
      setErrors({});
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.FK_Centre) {
      newErrors.FK_Centre = 'Le centre est obligatoire';
    }

    if (!formData.Nom_Agence.trim()) {
      newErrors.Nom_Agence = 'Le nom de l\'agence est obligatoire';
    } else if (formData.Nom_Agence.length > 200) {
      newErrors.Nom_Agence = 'Le nom ne peut pas dépasser 200 caractères';
    }

    if (!formData.Adresse.trim()) {
      newErrors.Adresse = 'L\'adresse est obligatoire';
    } else if (formData.Adresse.length > 400) {
      newErrors.Adresse = 'L\'adresse ne peut pas dépasser 400 caractères';
    }

    if (!formData.Telephone.trim()) {
      newErrors.Telephone = 'Le téléphone est obligatoire';
    } else if (formData.Telephone.length > 50) {
      newErrors.Telephone = 'Le téléphone ne peut pas dépasser 50 caractères';
    }

    if (formData.Email && formData.Email.length > 200) {
      newErrors.Email = 'L\'email ne peut pas dépasser 200 caractères';
    }

    if (formData.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
      newErrors.Email = 'Format d\'email invalide';
    }

    if (formData.Fax && formData.Fax.length > 50) {
      newErrors.Fax = 'Le fax ne peut pas dépasser 50 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };


  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="login-card" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header avec style login */}
        <div className="login-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{ fontSize: '20px', marginBottom: '4px' }}>
                {initialValues ? 'Modifier l\'Agence' : 'Nouvelle Agence'}
              </h1>
              <p style={{ fontSize: '12px', margin: 0 }}>
                {initialValues ? 'Mise à jour des informations' : 'Création d\'une nouvelle agence'}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors duration-200"
              aria-label="Fermer"
              style={{ color: 'inherit' }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
          <form onSubmit={handleSubmit} className="login-form" style={{ gap: '12px' }}>
            {/* Centre */}
            <div className="form-group">
              <label htmlFor="FK_Centre">Centre</label>
              <select
                id="FK_Centre"
                name="FK_Centre"
                value={formData.FK_Centre}
                onChange={handleChange}
                required
                disabled={loading}
                className={errors.FK_Centre ? 'error-input' : ''}
              >
                <option value="">Sélectionnez un centre</option>
                {centres.map((centre) => (
                  <option key={centre.CentreId} value={centre.CentreId}>
                    {centre.Nom_Centre}
                  </option>
                ))}
              </select>
              {errors.FK_Centre && (
                <div className="error-message">{errors.FK_Centre}</div>
              )}
              {loading && (
                <p style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                  Chargement des centres...
                </p>
              )}
            </div>

            {/* Nom de l'Agence */}
            <div className="form-group">
              <label htmlFor="Nom_Agence">Nom de l'Agence</label>
              <input
                type="text"
                id="Nom_Agence"
                name="Nom_Agence"
                value={formData.Nom_Agence}
                onChange={handleChange}
                placeholder="Entrez le nom de l'agence"
                maxLength={200}
                className={errors.Nom_Agence ? 'error-input' : ''}
              />
              {errors.Nom_Agence && (
                <div className="error-message">{errors.Nom_Agence}</div>
              )}
            </div>

            {/* Adresse */}
            <div className="form-group">
              <label htmlFor="Adresse">Adresse</label>
              <textarea
                id="Adresse"
                name="Adresse"
                value={formData.Adresse}
                onChange={handleChange}
                rows={3}
                placeholder="Entrez l'adresse complète de l'agence"
                maxLength={400}
                className={errors.Adresse ? 'error-input' : ''}
              />
              {errors.Adresse && (
                <div className="error-message">{errors.Adresse}</div>
              )}
            </div>

            {/* Téléphone et Fax sur la même ligne */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Téléphone */}
              <div className="form-group">
                <label htmlFor="Telephone">Téléphone</label>
                <input
                  type="tel"
                  id="Telephone"
                  name="Telephone"
                  value={formData.Telephone}
                  onChange={handleChange}
                  placeholder="Téléphone principal"
                  maxLength={50}
                  className={errors.Telephone ? 'error-input' : ''}
                />
                {errors.Telephone && (
                  <div className="error-message" style={{ fontSize: '11px' }}>{errors.Telephone}</div>
                )}
              </div>

              {/* Fax */}
              <div className="form-group">
                <label htmlFor="Fax">Fax</label>
                <input
                  type="tel"
                  id="Fax"
                  name="Fax"
                  value={formData.Fax}
                  onChange={handleChange}
                  placeholder="Numéro de fax"
                  maxLength={50}
                  className={errors.Fax ? 'error-input' : ''}
                />
                {errors.Fax && (
                  <div className="error-message" style={{ fontSize: '11px' }}>{errors.Fax}</div>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="Email">Email</label>
              <input
                type="email"
                id="Email"
                name="Email"
                value={formData.Email}
                onChange={handleChange}
                placeholder="email@exemple.com"
                maxLength={200}
                className={errors.Email ? 'error-input' : ''}
              />
              {errors.Email && (
                <div className="error-message">{errors.Email}</div>
              )}
            </div>

            {/* Bouton de soumission */}
            <button 
              type="submit" 
              className="login-button"
            >
              {initialValues ? 'Modifier' : 'Créer l\'agence'}
            </button>
          </form>
        </div>

        {/* Footer avec style login */}
        <div className="login-footer">
          <p>Remplissez tous les champs requis (*)</p>
        </div>
      </div>
    </div>
  );
}


