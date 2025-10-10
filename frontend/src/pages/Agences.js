import React, { useEffect, useState } from "react";
import AddAgencyModal from "../components/AddAgencyModal";
import Toast from "../components/Toast";
import agenceService from "../services/agenceService";

export default function Agences() {
  const [agences, setAgences] = useState([]);
  const [columns, setColumns] = useState([]);
  const [editId, setEditId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialValues, setInitialValues] = useState(null);
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });

  // Charger la liste des agences
  const loadAgences = async () => {
    const data = await agenceService.list();
    setAgences(data);
    // Déduire dynamiquement les colonnes à partir des objets retournés
    const keys = Array.from(
      data.reduce((acc, row) => {
        Object.keys(row || {}).forEach((k) => acc.add(k));
        return acc;
      }, new Set())
    );
    // Ordonner: champs principaux d'abord, puis le reste trié alpha
    const preferred = [
      'AgenceId',
      'Nom_Agence',
      'Adresse',
      'Telephone',
      'Email',
      'Fax',
      'Nom_Banque',
      'Compte_Bancaire',
      'NIF',
      'NCI',
      'CreatedAt',
      'UpdatedAt'
    ];
    const preferredSet = new Set(preferred);
    const orderedAll = [
      ...preferred.filter((k) => keys.includes(k)),
      ...keys.filter((k) => !preferredSet.has(k)).sort((a, b) => a.localeCompare(b))
    ];
    // Masquer certains champs
    const hidden = new Set(['NIF', 'NCI', 'CreatedAt']);
    const ordered = orderedAll.filter((k) => !hidden.has(k));
    setColumns(ordered);
  };

  useEffect(() => {
    loadAgences();
  }, []);

  // Soumission depuis le modal
  const handleSubmitModal = async (data) => {
    try {
      // Vérif doublon côté client (nom agence, insensible à la casse/espaces)
      const normalized = (s) => String(s || '').trim().toLowerCase();
      if (!editId) {
        const exists = agences.some((a) => normalized(a.Nom_Agence) === normalized(data.Nom_Agence));
        if (exists) {
          setToast({ open: true, type: "error", message: "Cette agence existe déjà." });
          return;
        }
      }
      if (editId) {
        await agenceService.update(editId, data);
        setToast({ open: true, type: "success", message: "Agence modifiée avec succès." });
      } else {
        await agenceService.create(data);
        setToast({ open: true, type: "success", message: "Agence enregistrée avec succès." });
      }
      setModalOpen(false);
      setEditId(null);
      setInitialValues(null);
      loadAgences();
    } catch (err) {
      const msg = err?.response?.data?.message || "Une erreur est survenue lors de l'enregistrement.";
      setToast({ open: true, type: "error", message: msg });
    }
  };

  const handleEdit = (agence) => {
    setInitialValues(agence);
    setEditId(agence.AgenceId);
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setInitialValues(null);
    setEditId(null);
    setModalOpen(true);
  };

  return (
    <div className="p-6 text-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-blue-700">
          Gestion des Agences Commerciales
        </h1>

        {/* ✅ Bouton Ajouter (ouvre le modal) */}
        <div className="relative group">
          <button
            onClick={openCreateModal}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white px-5 py-2.5 rounded-xl shadow-md transition duration-200 inline-flex items-center gap-2"
          >
            <span className="inline-block">➕</span>
            <span className="font-medium">Ajouter une agence</span>
          </button>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 mt-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            Ouvrir la boîte de dialogue d’ajout
          </div>
        </div>
      </div>
      {/* ✅ Modal d'ajout / modification */}
      <AddAgencyModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditId(null); setInitialValues(null); }}
        onSubmit={handleSubmitModal}
        initialValues={initialValues}
      />

      {/* ✅ Tableau des agences (colonnes dynamiques) */}
      <div className="overflow-x-auto bg-white shadow-md rounded-xl border border-blue-100">
        <table className="min-w-full border-collapse">
          <thead className="bg-blue-100 text-blue-800">
            <tr>
              {columns.map((col) => (
                <th key={col} className="py-2 px-4 text-left whitespace-nowrap">{col}</th>
              ))}
              <th className="py-2 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agences.map((row) => (
              <tr key={row.AgenceId || JSON.stringify(row)} className="border-t hover:bg-blue-50">
                {columns.map((col) => (
                  <td key={col} className="py-2 px-4 whitespace-nowrap">{String(row[col] ?? '')}</td>
                ))}
                <td className="py-2 px-4 text-center">
                  <button
                    onClick={() => handleEdit(row)}
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

    {/* ✅ Messages bulle (toasts) */}
    <Toast
      open={toast.open}
      type={toast.type}
      message={toast.message}
      onClose={() => setToast({ ...toast, open: false })}
    />
    </div>
  );
}
