import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Phone, Mail, FileText, CreditCard, Hash } from 'lucide-react';
import '../pages/Login.css';

const CentresAddModal = ({ isOpen, onClose, onSubmit, initialValues }) => {
  const [formData, setFormData] = useState({
    nom_centre: '',
    adresse: '',
    telephone: '',
    telephone2: '',
    email: '',
    fax: '',
    nom_banque: '',
    compte_bancaire: '',
    nif: '',
    nis: '',
    rc: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialValues) {
      setFormData({
        nom_centre: initialValues.Nom_Centre || '',
        adresse: initialValues.Adresse || '',
        telephone: initialValues.Telephone || '',
        telephone2: initialValues.Telephone2 || '',
        email: initialValues.Email || '',
        fax: initialValues.Fax || '',
        nom_banque: initialValues.Nom_Banque || '',
        compte_bancaire: initialValues.Compte_Bancaire || '',
        nif: initialValues.NIF || '',
        nis: initialValues.NIS || '',
        rc: initialValues.RC || ''
      });
    } else {
      setFormData({
        nom_centre: '',
        adresse: '',
        telephone: '',
        telephone2: '',
        email: '',
        fax: '',
        nom_banque: '',
        compte_bancaire: '',
        nif: '',
        nis: '',
        rc: ''
      });
    }
    setErrors({});
  }, [initialValues, isOpen]);

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

    if (!formData.nom_centre.trim()) {
      newErrors.nom_centre = 'Le nom du centre est obligatoire';
    } else if (formData.nom_centre.length > 200) {
      newErrors.nom_centre = 'Le nom du centre ne peut pas dépasser 200 caractères';
    }

    if (!formData.adresse.trim()) {
      newErrors.adresse = 'L\'adresse est obligatoire';
    } else if (formData.adresse.length > 400) {
      newErrors.adresse = 'L\'adresse ne peut pas dépasser 400 caractères';
    }

    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Le téléphone est obligatoire';
    } else if (formData.telephone.length > 50) {
      newErrors.telephone = 'Le téléphone ne peut pas dépasser 50 caractères';
    }

    if (formData.email && formData.email.length > 200) {
      newErrors.email = 'L\'email ne peut pas dépasser 200 caractères';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (formData.fax && formData.fax.length > 50) {
      newErrors.fax = 'Le fax ne peut pas dépasser 50 caractères';
    }

    if (formData.telephone2 && formData.telephone2.length > 50) {
      newErrors.telephone2 = 'Le téléphone 2 ne peut pas dépasser 50 caractères';
    }

    if (formData.nom_banque && formData.nom_banque.length > 200) {
      newErrors.nom_banque = 'Le nom de la banque ne peut pas dépasser 200 caractères';
    }

    if (formData.compte_bancaire && formData.compte_bancaire.length > 100) {
      newErrors.compte_bancaire = 'Le compte bancaire ne peut pas dépasser 100 caractères';
    }

    if (formData.nif && formData.nif.length > 50) {
      newErrors.nif = 'Le NIF ne peut pas dépasser 50 caractères';
    }

    if (formData.nis && formData.nis.length > 50) {
      newErrors.nis = 'Le NIS ne peut pas dépasser 50 caractères';
    }

    if (formData.rc && formData.rc.length > 50) {
      newErrors.rc = 'Le RC ne peut pas dépasser 50 caractères';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="login-card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header avec style login */}
        <div className="login-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{ fontSize: '20px', marginBottom: '4px' }}>
                {initialValues ? 'Modifier le Centre' : 'Nouveau Centre'}
              </h1>
              <p style={{ fontSize: '12px', margin: 0 }}>
                {initialValues ? 'Mise à jour des informations' : 'Création d\'un nouveau centre'}
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
          <form onSubmit={handleSubmit} className="login-form" id="centre-form" style={{ gap: '12px' }}>
            {/* Nom du Centre */}
            <div className="form-group">
              <label htmlFor="nom_centre">Nom du Centre</label>
              <input
                type="text"
                id="nom_centre"
                name="nom_centre"
                value={formData.nom_centre}
                onChange={handleChange}
                placeholder="Entrez le nom du centre"
                maxLength={200}
                className={errors.nom_centre ? 'error-input' : ''}
              />
              {errors.nom_centre && (
                <div className="error-message">{errors.nom_centre}</div>
              )}
            </div>

            {/* Adresse */}
            <div className="form-group">
              <label htmlFor="adresse">Adresse</label>
              <textarea
                id="adresse"
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                rows={3}
                placeholder="Entrez l'adresse complète du centre"
                maxLength={400}
                className={errors.adresse ? 'error-input' : ''}
                style={{
                  padding: '8px 12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '13px',
                  transition: 'all 0.3s ease',
                  backgroundColor: 'white',
                  color: '#333',
                  width: '100%',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
              {errors.adresse && (
                <div className="error-message">{errors.adresse}</div>
              )}
            </div>

            {/* Téléphone et Téléphone 2 sur la même ligne */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Téléphone */}
              <div className="form-group">
                <label htmlFor="telephone">Téléphone</label>
                <input
                  type="tel"
                  id="telephone"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="Téléphone principal"
                  maxLength={50}
                  className={errors.telephone ? 'error-input' : ''}
                />
                {errors.telephone && (
                  <div className="error-message" style={{ fontSize: '11px' }}>{errors.telephone}</div>
                )}
              </div>

              {/* Téléphone 2 */}
              <div className="form-group">
                <label htmlFor="telephone2">Téléphone 2</label>
                <input
                  type="tel"
                  id="telephone2"
                  name="telephone2"
                  value={formData.telephone2}
                  onChange={handleChange}
                  placeholder="Téléphone secondaire"
                  maxLength={50}
                  className={errors.telephone2 ? 'error-input' : ''}
                />
                {errors.telephone2 && (
                  <div className="error-message" style={{ fontSize: '11px' }}>{errors.telephone2}</div>
                )}
              </div>
            </div>

            {/* Fax et Email sur la même ligne */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Fax */}
              <div className="form-group">
                <label htmlFor="fax">Fax</label>
                <input
                  type="tel"
                  id="fax"
                  name="fax"
                  value={formData.fax}
                  onChange={handleChange}
                  placeholder="Numéro de fax"
                  maxLength={50}
                  className={errors.fax ? 'error-input' : ''}
                />
                {errors.fax && (
                  <div className="error-message" style={{ fontSize: '11px' }}>{errors.fax}</div>
                )}
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@exemple.com"
                  maxLength={200}
                  className={errors.email ? 'error-input' : ''}
                />
                {errors.email && (
                  <div className="error-message" style={{ fontSize: '11px' }}>{errors.email}</div>
                )}
              </div>
            </div>

            {/* Nom de la Banque */}
            <div className="form-group">
              <label htmlFor="nom_banque">Nom de la Banque</label>
              <input
                type="text"
                id="nom_banque"
                name="nom_banque"
                value={formData.nom_banque}
                onChange={handleChange}
                placeholder="Nom de la banque (optionnel)"
                maxLength={200}
                className={errors.nom_banque ? 'error-input' : ''}
              />
              {errors.nom_banque && (
                <div className="error-message">{errors.nom_banque}</div>
              )}
            </div>

            {/* Compte Bancaire */}
            <div className="form-group">
              <label htmlFor="compte_bancaire">Compte Bancaire</label>
              <input
                type="text"
                id="compte_bancaire"
                name="compte_bancaire"
                value={formData.compte_bancaire}
                onChange={handleChange}
                placeholder="Numéro de compte bancaire (optionnel)"
                maxLength={100}
                className={errors.compte_bancaire ? 'error-input' : ''}
              />
              {errors.compte_bancaire && (
                <div className="error-message">{errors.compte_bancaire}</div>
              )}
            </div>

            {/* NIF */}
            <div className="form-group">
              <label htmlFor="nif">NIF (Numéro d'Identification Fiscale)</label>
              <input
                type="text"
                id="nif"
                name="nif"
                value={formData.nif}
                onChange={handleChange}
                placeholder="NIF (optionnel)"
                maxLength={50}
                className={errors.nif ? 'error-input' : ''}
              />
              {errors.nif && (
                <div className="error-message">{errors.nif}</div>
              )}
            </div>

            {/* NIS */}
            <div className="form-group">
              <label htmlFor="nis">NIS (Numéro d'Identification Statistique)</label>
              <input
                type="text"
                id="nis"
                name="nis"
                value={formData.nis}
                onChange={handleChange}
                placeholder="NIS (optionnel)"
                maxLength={50}
                className={errors.nis ? 'error-input' : ''}
              />
              {errors.nis && (
                <div className="error-message">{errors.nis}</div>
              )}
            </div>

            {/* RC */}
            <div className="form-group">
              <label htmlFor="rc">RC (Registre du Commerce)</label>
              <input
                type="text"
                id="rc"
                name="rc"
                value={formData.rc}
                onChange={handleChange}
                placeholder="RC (optionnel)"
                maxLength={50}
                className={errors.rc ? 'error-input' : ''}
              />
              {errors.rc && (
                <div className="error-message">{errors.rc}</div>
              )}
            </div>

            {/* Bouton de soumission */}
            <button 
              type="submit" 
              className="login-button"
            >
              {initialValues ? 'Modifier' : 'Créer le centre'}
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
};

export default CentresAddModal;
