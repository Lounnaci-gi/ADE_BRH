import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import userService from '../services/userService';
import './Login.css';

const Settings = () => {
  const [pwd, setPwd] = React.useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [showPassword, setShowPassword] = React.useState({
    current: false,
    next: false,
    confirm: false
  });

  const onChange = (e) => {
    setPwd({ ...pwd, [e.target.name]: e.target.value });
    setMessage('');
    setError('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword({ ...showPassword, [field]: !showPassword[field] });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    if (!pwd.current || !pwd.next) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    if (pwd.next !== pwd.confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (pwd.next.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    setSaving(true);
    try {
      await userService.updatePassword({ current: pwd.current, next: pwd.next });
      setMessage('Mot de passe mis à jour avec succès');
      setPwd({ current: '', next: '', confirm: '' });
    } catch (err) {
      setError(err?.response?.data?.message || 'Erreur lors de la mise à jour du mot de passe');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Changer le Mot de Passe</h1>
          <p>Mettez à jour votre mot de passe de sécurité</p>
        </div>

        <form onSubmit={onSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div style={{
              background: '#efe',
              color: '#3a3',
              padding: '8px 12px',
              borderRadius: '6px',
              borderLeft: '4px solid #3a3',
              fontSize: '13px'
            }}>
              {message}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="current">Mot de passe actuel</label>
            <div className="relative">
              <input
                type={showPassword.current ? "text" : "password"}
                id="current"
                name="current"
                value={pwd.current}
                onChange={onChange}
                placeholder="Entrez votre mot de passe actuel"
                required
                disabled={saving}
                className="w-full pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                onMouseDown={() => togglePasswordVisibility('current')}
                onMouseUp={() => togglePasswordVisibility('current')}
                onMouseLeave={() => togglePasswordVisibility('current')}
                disabled={saving}
              >
                {showPassword.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="next">Nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showPassword.next ? "text" : "password"}
                id="next"
                name="next"
                value={pwd.next}
                onChange={onChange}
                placeholder="Entrez votre nouveau mot de passe"
                required
                disabled={saving}
                className="w-full pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                onMouseDown={() => togglePasswordVisibility('next')}
                onMouseUp={() => togglePasswordVisibility('next')}
                onMouseLeave={() => togglePasswordVisibility('next')}
                disabled={saving}
              >
                {showPassword.next ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirm">Confirmer le nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showPassword.confirm ? "text" : "password"}
                id="confirm"
                name="confirm"
                value={pwd.confirm}
                onChange={onChange}
                placeholder="Confirmez votre nouveau mot de passe"
                required
                disabled={saving}
                className="w-full pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                onMouseDown={() => togglePasswordVisibility('confirm')}
                onMouseUp={() => togglePasswordVisibility('confirm')}
                onMouseLeave={() => togglePasswordVisibility('confirm')}
                disabled={saving}
              >
                {showPassword.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={saving}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;


