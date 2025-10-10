import React from 'react';
import userService from '../services/userService';

const Settings = () => {
  const [pwd, setPwd] = React.useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const onChange = (e) => setPwd({ ...pwd, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (pwd.next !== pwd.confirm) {
      setMessage('Les mots de passe ne correspondent pas');
      return;
    }
    setSaving(true);
    try {
      await userService.updatePassword({ current: pwd.current, next: pwd.next });
      setMessage('Mot de passe mis à jour');
      setPwd({ current: '', next: '', confirm: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6 max-w-md">
      <h2 className="text-lg font-semibold mb-4">Paramètres</h2>
      {message && <div className="mb-3 text-sm text-water-700 dark:text-water-300">{message}</div>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Mot de passe actuel</label>
          <input className="input" type="password" name="current" value={pwd.current} onChange={onChange} />
        </div>
        <div>
          <label className="block text-sm mb-1">Nouveau mot de passe</label>
          <input className="input" type="password" name="next" value={pwd.next} onChange={onChange} />
        </div>
        <div>
          <label className="block text-sm mb-1">Confirmer</label>
          <input className="input" type="password" name="confirm" value={pwd.confirm} onChange={onChange} />
        </div>
        <button className="btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
      </form>
    </div>
  );
};

export default Settings;


