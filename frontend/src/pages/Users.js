import React, { useEffect, useState } from 'react';
import UsersAddModal from '../components/UsersAddModal';
import userService from '../services/userService';

function Users() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.list();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (payload) => {
    try {
      await userService.create(payload);
      setOpen(false);
      await loadUsers();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">👥 Gestion des utilisateurs</h1>
        <button onClick={() => setOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white px-4 py-2 rounded-xl shadow-md transition inline-flex items-center gap-2">
          <span>➕</span>
          <span className="font-medium">Nouvel utilisateur</span>
        </button>
      </div>

      <table className="min-w-full bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-blue-600 text-white text-left">
            <th className="p-3">Nom d'utilisateur</th>
            <th className="p-3">Rôle</th>
            <th className="p-3">Email</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td className="p-3" colSpan="3">Chargement…</td></tr>
          )}
          {!loading && users.map((u, i) => (
            <tr key={i} className="border-b hover:bg-gray-100">
              <td className="p-3">{u.username}</td>
              <td className="p-3 capitalize">{u.role}</td>
              <td className="p-3">{u.email}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <UsersAddModal open={open} onClose={() => setOpen(false)} onSubmit={handleCreate} />
    </div>
  );
}

export default Users;
