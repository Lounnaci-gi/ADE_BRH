import React, { useEffect, useState } from 'react';
import { Pencil, Trash2, Printer, User, Mail, Lock, Save } from 'lucide-react';
import UsersAddModal from '../components/UsersAddModal';
import Toast from '../components/Toast';
import userService from '../services/userService';
import authService from '../services/authService';

function Users() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editUserId, setEditUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, type: 'success', message: '' });
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [originalProfileData, setOriginalProfileData] = useState({
    username: '',
    email: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const user = authService.getCurrentUser();
  const isAdmin = (user?.role || '').toString() === 'Administrateur';

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.list();
      setUsers(data);
      
      // Si c'est un utilisateur standard, remplir le formulaire de profil avec les données de l'utilisateur connecté
      if (!isAdmin) {
        const currentUser = authService.getCurrentUser();
        const userData = {
          username: currentUser?.username || '',
          email: currentUser?.email || ''
        };
        setProfileForm({
          ...userData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setOriginalProfileData(userData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileCancel = () => {
    setProfileForm({
      username: originalProfileData.username,
      email: originalProfileData.email,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      setToast({ open: true, type: 'error', message: 'Les mots de passe ne correspondent pas.' });
      return;
    }

    try {
      setProfileLoading(true);
      const payload = {
        username: profileForm.username,
        email: profileForm.email
      };
      
      if (profileForm.newPassword) {
        payload.currentPassword = profileForm.currentPassword;
        payload.newPassword = profileForm.newPassword;
      }
      
      await userService.updateOwnProfile(payload);
      setToast({ open: true, type: 'success', message: 'Profil mis à jour avec succès.' });
      
      // Réinitialiser les champs de mot de passe
      setProfileForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (e) {
      const msg = e?.response?.data?.message || 'Erreur lors de la mise à jour du profil.';
      setToast({ open: true, type: 'error', message: msg });
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    
    // Initialiser le formulaire de profil pour les utilisateurs standard
    if (!isAdmin) {
      const currentUser = authService.getCurrentUser();
      const userData = {
        username: currentUser?.username || '',
        email: currentUser?.email || ''
      };
      setProfileForm({
        ...userData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setOriginalProfileData(userData);
    }
  }, [isAdmin]);

  const handleCreate = async (payload) => {
    try {
      if (editUserId != null) {
        await userService.update(editUserId, payload);
      } else {
        await userService.create(payload);
      }
      setOpen(false);
      setEditUser(null);
      setEditUserId(null);
      await loadUsers();
      setToast({ open: true, type: 'success', message: 'Utilisateur créé avec succès.' });
    } catch (e) {
      const msg = e?.response?.data?.message || 'Une erreur est survenue lors de la création.';
      setToast({ open: true, type: 'error', message: msg });
    }
  };

  const handleEditClick = (u) => {
    setEditUser(u);
    setEditUserId(u?.UtilisateurId ?? u?.id ?? null);
    setOpen(true);
  };

  const handleDeleteClick = async (u) => {
    if (!window.confirm(`Supprimer l'utilisateur ${u.username} ?`)) return;
    try {
      await userService.remove(u.UtilisateurId);
      await loadUsers();
      setToast({ open: true, type: 'success', message: 'Utilisateur supprimé.' });
    } catch (e) {
      const msg = e?.response?.data?.message || 'Erreur lors de la suppression.';
      setToast({ open: true, type: 'error', message: msg });
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isAdmin ? '👥 Gestion des utilisateurs' : '👤 Mon profil'}
        </h1>
        {isAdmin && (
          <button onClick={() => setOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white px-4 py-2 rounded-xl shadow-md transition inline-flex items-center gap-2">
            <span>➕</span>
            <span className="font-medium">Nouvel utilisateur</span>
          </button>
        )}
      </div>

      {isAdmin ? (
        // Interface Admin - Liste des utilisateurs
        <>
          <table className="min-w-full bg-white rounded-lg shadow">
            <thead>
              <tr className="bg-blue-600 text-white text-left">
                <th className="p-3">Nom d'utilisateur</th>
                <th className="p-3">Rôle</th>
                <th className="p-3">Email</th>
                <th className="p-3">Agence</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td className="p-3" colSpan="5">Chargement…</td></tr>
              )}
              {!loading && users.map((u, i) => (
                <tr key={i} className="border-b hover:bg-gray-100">
                  <td className="p-3">{u.username}</td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.agence || '-'}</td>
                  <td className="p-3 text-center space-x-2">
                    <button title="Modifier" className="inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-blue-50" onClick={() => handleEditClick(u)}>
                      <Pencil className="h-4 w-4 text-blue-600" />
                    </button>
                    <button title="Supprimer" className="inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-red-50" onClick={() => handleDeleteClick(u)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                    <button title="Imprimer" className="inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100" onClick={() => window.print()}>
                      <Printer className="h-4 w-4 text-gray-700" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <UsersAddModal
            open={open}
            onClose={() => { setOpen(false); setEditUser(null); setEditUserId(null); }}
            onSubmit={handleCreate}
            initialValues={editUser ? {
              username: editUser.username,
              email: editUser.email,
              role: editUser.role,
              agenceId: editUser.agenceId || ''
            } : undefined}
          />
        </>
      ) : (
        // Interface Standard - Formulaire de profil
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-2" />
                    Nom d'utilisateur
                  </label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline h-4 w-4 mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  <Lock className="inline h-5 w-5 mr-2" />
                  Changer le mot de passe (optionnel)
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe actuel
                    </label>
                    <input
                      type="password"
                      value={profileForm.currentPassword}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        value={profileForm.newPassword}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmer le mot de passe
                      </label>
                      <input
                        type="password"
                        value={profileForm.confirmPassword}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleProfileCancel}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg shadow-md transition inline-flex items-center gap-2"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg shadow-md transition inline-flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {profileLoading ? 'Mise à jour...' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  );
}

export default Users;
