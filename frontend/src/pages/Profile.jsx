import React from 'react';
import userService from '../services/userService';

const Profile = () => {
  const [form, setForm] = React.useState({ username: '', email: '' });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    userService.me().then((data) => {
      setForm({ username: data?.username || '', email: data?.email || '' });
    }).finally(() => setLoading(false));
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await userService.updateProfile(form);
      setMessage('Profil mis à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="card p-6">Chargement...</div>;

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-4">Profil</h2>
      {message && <div className="mb-3 text-sm text-water-700 dark:text-water-300">{message}</div>}
      <form onSubmit={onSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm mb-1">Nom d'utilisateur</label>
          <input className="input" name="username" value={form.username} onChange={onChange} />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="input" name="email" value={form.email} onChange={onChange} />
        </div>
        <button className="btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
      </form>
    </div>
  );
};

export default Profile;


