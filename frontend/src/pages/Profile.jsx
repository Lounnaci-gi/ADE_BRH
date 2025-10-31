import React from 'react';
import userService from '../services/userService';
import './Login.css';

const Profile = () => {
  const [form, setForm] = React.useState({ username: '', email: '' });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    userService.me().then((data) => {
      setForm({ username: data?.username || '', email: data?.email || '' });
    }).catch((err) => {
      setError('Erreur lors du chargement du profil');
      console.error(err);
    }).finally(() => setLoading(false));
  }, []);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage('');
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await userService.updateProfile(form);
      setMessage('Profil mis à jour avec succès');
    } catch (err) {
      setError(err?.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Chargement...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Mon Profil</h1>
          <p>Modifiez vos informations personnelles</p>
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
            <label htmlFor="username">Nom d'utilisateur</label>
            <input
              type="text"
              id="username"
              name="username"
              value={form.username}
              onChange={onChange}
              placeholder="Entrez votre nom d'utilisateur"
              required
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="Entrez votre email"
              required
              disabled={saving}
            />
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

export default Profile;


