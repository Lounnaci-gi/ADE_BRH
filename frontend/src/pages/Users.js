import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Users() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Récupération des utilisateurs depuis ton backend (à créer plus tard)
    axios.get('http://localhost:5000/api/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">👥 Gestion des utilisateurs</h1>

      <table className="min-w-full bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-blue-600 text-white text-left">
            <th className="p-3">Nom d'utilisateur</th>
            <th className="p-3">Rôle</th>
            <th className="p-3">Email</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={i} className="border-b hover:bg-gray-100">
              <td className="p-3">{u.username}</td>
              <td className="p-3 capitalize">{u.role}</td>
              <td className="p-3">{u.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Users;
