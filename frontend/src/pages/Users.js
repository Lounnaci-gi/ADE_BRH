import React, { useEffect, useState } from 'react';
import { Pencil, Trash2, Printer, User, Mail, Lock, Save } from 'lucide-react';
import UsersAddModal from '../components/UsersAddModal';
import { swalConfirmDelete, swalSuccess, swalError } from '../utils/swal';
import userService from '../services/userService';
import authService from '../services/authService';

function Users() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editUserId, setEditUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  // Toast remplacé par SweetAlert2
  const [selectedUser, setSelectedUser] = useState(null);
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
      await swalError('Les mots de passe ne correspondent pas.', 'Erreur');
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
      await swalSuccess('Profil mis à jour avec succès.');
      
      // Réinitialiser les champs de mot de passe
      setProfileForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (e) {
      const msg = e?.response?.data?.message || 'Erreur lors de la mise à jour du profil.';
      await swalError(msg);
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
        await swalSuccess('Utilisateur modifié avec succès.');
      } else {
      await userService.create(payload);
        await swalSuccess('Utilisateur créé avec succès.');
      }
      setOpen(false);
      setEditUser(null);
      setEditUserId(null);
      await loadUsers();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Une erreur est survenue lors de la création.';
      await swalError(msg);
    }
  };

  const handleEditClick = (u) => {
    setEditUser(u);
    setEditUserId(u?.UtilisateurId ?? u?.id ?? null);
    setOpen(true);
  };

  const askDelete = async (u) => {
    setSelectedUser(u);
    const result = await swalConfirmDelete({
      title: 'Supprimer cet utilisateur ? ',
      text: `"${u.username}" sera définitivement supprimé.`,
    });
    if (result.isConfirmed) {
      await handleDelete(u);
    } else {
      setSelectedUser(null);
    }
  };

  const handleDelete = async (userParam) => {
    const userToDelete = userParam || selectedUser;
    if (!userToDelete?.UtilisateurId) {
      return;
    }
    try {
      await userService.remove(userToDelete.UtilisateurId);
      await loadUsers();
      await swalSuccess('Utilisateur supprimé.');
    } catch (e) {
      const msg = e?.response?.data?.message || 'Erreur lors de la suppression.';
      await swalError(msg);
    } finally {
      setSelectedUser(null);
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
          <div className="table-container bg-white shadow-md rounded-xl border border-blue-100 w-full">
            <table className="w-full border-collapse min-w-full">
              <thead className="bg-blue-100 text-blue-800">
                <tr>
                  <th className="py-3 px-6 text-left whitespace-nowrap font-semibold text-sm">Nom d'utilisateur</th>
                  <th className="py-3 px-6 text-left whitespace-nowrap font-semibold text-sm">Rôle</th>
                  <th className="py-3 px-6 text-left whitespace-nowrap font-semibold text-sm">Email</th>
                  <th className="py-3 px-6 text-left whitespace-nowrap font-semibold text-sm">Agence</th>
                  <th className="py-3 px-6 text-center font-semibold text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
                <tr><td className="py-2 px-6 text-sm" colSpan="5">Chargement…</td></tr>
          )}
          {!loading && users.map((u, i) => (
                <tr key={i} className="border-t hover:bg-blue-50">
                  <td className="py-2 px-6 whitespace-nowrap text-sm">{u.username}</td>
                  <td className="py-2 px-6 whitespace-nowrap text-sm">{u.role}</td>
                  <td className="py-2 px-6 whitespace-nowrap text-sm">{u.email}</td>
                  <td className="py-2 px-6 whitespace-nowrap text-sm">{u.agence || '-'}</td>
                  <td className="py-2 px-6 text-center space-x-2">
                    <button title="Modifier" className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-blue-50" onClick={() => handleEditClick(u)}>
                      <Pencil className="h-3.5 w-3.5 text-blue-600" />
                    </button>
                    <button title="Supprimer" className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-red-50" onClick={() => askDelete(u)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    </button>
                    <button title="Imprimer" className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100" onClick={() => window.print()}>
                      <Printer className="h-3.5 w-3.5 text-gray-700" />
                    </button>
                  </td>
            </tr>
          ))}
        </tbody>
      </table>
          </div>

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
        // Interface Standard - Formulaire de profil élégant et professionnel
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 rounded-3xl shadow-xl p-8 border border-blue-100/50 backdrop-blur-sm">
            {/* En-tête du formulaire */}
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Mon Profil</h2>
                <p className="text-sm text-gray-600">Gérez vos informations personnelles et votre sécurité</p>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-8">
              {/* Section Informations personnelles */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Informations personnelles</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      Nom d'utilisateur *
                    </label>
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                      placeholder="Entrez votre nom d'utilisateur"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                      <div className="p-2 bg-green-100 rounded-lg mr-3">
                        <Mail className="h-4 w-4 text-green-600" />
                      </div>
                      Adresse email *
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                      placeholder="votre.email@exemple.com"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section Sécurité */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Lock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Sécurité du compte</h3>
                    <p className="text-sm text-gray-500">Modifiez votre mot de passe pour renforcer la sécurité</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                      <div className="p-2 bg-gray-100 rounded-lg mr-3">
                        <Lock className="h-4 w-4 text-gray-600" />
                      </div>
                      Mot de passe actuel
                    </label>
                    <input
                      type="password"
                      value={profileForm.currentPassword}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                      placeholder="Entrez votre mot de passe actuel"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg mr-3">
                          <Lock className="h-4 w-4 text-purple-600" />
                        </div>
                        Nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        value={profileForm.newPassword}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                        placeholder="Entrez votre nouveau mot de passe"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                        <div className="p-2 bg-red-100 rounded-lg mr-3">
                          <Lock className="h-4 w-4 text-red-600" />
                        </div>
                        Confirmer le mot de passe
                      </label>
                      <input
                        type="password"
                        value={profileForm.confirmPassword}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                        placeholder="Confirmez votre nouveau mot de passe"
                      />
                    </div>
                  </div>
                  
                  {/* Note informative */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-blue-100 rounded-lg">
                        <Lock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-blue-800 mb-1">Conseils de sécurité</h4>
                        <p className="text-sm text-blue-700">
                          Utilisez un mot de passe fort avec au moins 8 caractères, incluant des majuscules, des minuscules, des chiffres et des symboles.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end gap-4 pt-6">
                <button
                  type="button"
                  onClick={handleProfileCancel}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 inline-flex items-center gap-2 font-medium text-sm transform hover:scale-105"
                >
                  <span>Annuler</span>
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 inline-flex items-center gap-2 font-medium text-sm transform hover:scale-105"
                >
                  <Save className="h-4 w-4" />
                  {profileLoading ? 'Mise à jour...' : 'Sauvegarder les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notifications gérées via SweetAlert2 */}

      {/* Confirmations et succès gérés avec SweetAlert2 */}
    </div>
  );
}

export default Users;
