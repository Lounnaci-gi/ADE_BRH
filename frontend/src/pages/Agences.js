import React, { useEffect, useState } from "react";

export default function Agences() {
  const [agences, setAgences] = useState([]);
  const [formData, setFormData] = useState({
    Nom_Agence: "",
    Adresse: "",
    Telephone: "",
    Email: "",
    Fax: "",
    Nom_Banque: "",
    Compte_Bancaire: "",
    NIF: "",
    NCI: "",
  });
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false); // 👈 visibilité du formulaire

  const API_URL = "http://localhost:5000/api/agences"; // ⚙️ à adapter si besoin

  // Charger la liste des agences
  const loadAgences = async () => {
    const res = await fetch(API_URL);
    const data = await res.json();
    setAgences(data);
  };

  useEffect(() => {
    loadAgences();
  }, []);

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editId ? "PUT" : "POST";
    const url = editId ? `${API_URL}/${editId}` : API_URL;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const result = await res.json();
    console.log(result);

    setFormData({
      Nom_Agence: "",
      Adresse: "",
      Telephone: "",
      Email: "",
      Fax: "",
      Nom_Banque: "",
      Compte_Bancaire: "",
      NIF: "",
      NCI: "",
    });

    setEditId(null);
    setShowForm(false); // 👈 cacher le formulaire après enregistrement
    loadAgences();
  };

  const handleEdit = (agence) => {
    setFormData(agence);
    setEditId(agence.AgenceId);
    setShowForm(true); // 👈 afficher le formulaire
  };

  const handleCancel = () => {
    setEditId(null);
    setShowForm(false);
    setFormData({
      Nom_Agence: "",
      Adresse: "",
      Telephone: "",
      Email: "",
      Fax: "",
      Nom_Banque: "",
      Compte_Bancaire: "",
      NIF: "",
      NCI: "",
    });
  };

  return (
    <div className="p-6 text-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-blue-700">
          Gestion des Agences Commerciales
        </h1>

        {/* ✅ Bouton Ajouter */}
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditId(null);
            setFormData({
              Nom_Agence: "",
              Adresse: "",
              Telephone: "",
              Email: "",
              Fax: "",
              Nom_Banque: "",
              Compte_Bancaire: "",
              NIF: "",
              NCI: "",
            });
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition duration-300"
        >
          {showForm ? "Fermer le formulaire" : "➕ Ajouter une agence"}
        </button>
      </div>

      {/* ✅ Formulaire masqué/affiché */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-xl p-6 mb-8 max-w-4xl transition-all duration-300 border border-blue-100"
        >
          <h2 className="text-xl font-medium text-blue-700 mb-4">
            {editId ? "Modifier l’agence" : "Nouvelle agence commerciale"}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nom de l'agence"
              className="border p-2 rounded-lg"
              value={formData.Nom_Agence}
              onChange={(e) =>
                setFormData({ ...formData, Nom_Agence: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Adresse"
              className="border p-2 rounded-lg"
              value={formData.Adresse}
              onChange={(e) =>
                setFormData({ ...formData, Adresse: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Téléphone"
              className="border p-2 rounded-lg"
              value={formData.Telephone}
              onChange={(e) =>
                setFormData({ ...formData, Telephone: e.target.value })
              }
              required
            />
            <input
              type="email"
              placeholder="Email"
              className="border p-2 rounded-lg"
              value={formData.Email}
              onChange={(e) =>
                setFormData({ ...formData, Email: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Fax"
              className="border p-2 rounded-lg"
              value={formData.Fax}
              onChange={(e) =>
                setFormData({ ...formData, Fax: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Nom de la banque"
              className="border p-2 rounded-lg"
              value={formData.Nom_Banque}
              onChange={(e) =>
                setFormData({ ...formData, Nom_Banque: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Compte bancaire"
              className="border p-2 rounded-lg"
              value={formData.Compte_Bancaire}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  Compte_Bancaire: e.target.value,
                })
              }
            />
            <input
              type="text"
              placeholder="NIF"
              className="border p-2 rounded-lg"
              value={formData.NIF}
              onChange={(e) => setFormData({ ...formData, NIF: e.target.value })}
            />
            <input
              type="text"
              placeholder="NCI"
              className="border p-2 rounded-lg"
              value={formData.NCI}
              onChange={(e) => setFormData({ ...formData, NCI: e.target.value })}
            />
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition duration-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md transition duration-300"
            >
              {editId ? "Modifier" : "Enregistrer"}
            </button>
          </div>
        </form>
      )}

      {/* ✅ Tableau des agences */}
      <div className="overflow-x-auto bg-white shadow-md rounded-xl border border-blue-100">
        <table className="min-w-full border-collapse">
          <thead className="bg-blue-100 text-blue-800">
            <tr>
              <th className="py-2 px-4 text-left">Nom</th>
              <th className="py-2 px-4 text-left">Téléphone</th>
              <th className="py-2 px-4 text-left">Email</th>
              <th className="py-2 px-4 text-left">Banque</th>
              <th className="py-2 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agences.map((a) => (
              <tr key={a.AgenceId} className="border-t hover:bg-blue-50">
                <td className="py-2 px-4">{a.Nom_Agence}</td>
                <td className="py-2 px-4">{a.Telephone}</td>
                <td className="py-2 px-4">{a.Email}</td>
                <td className="py-2 px-4">{a.Nom_Banque}</td>
                <td className="py-2 px-4 text-center">
                  <button
                    onClick={() => handleEdit(a)}
                    className="text-blue-600 hover:underline"
                  >
                    ✏️ Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
