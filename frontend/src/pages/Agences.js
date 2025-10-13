import React, { useEffect, useState } from "react";
import { Pencil, Trash2, Printer } from 'lucide-react';
import AddAgencyModal from "../components/AddAgencyModal";
import Toast from "../components/Toast";
import agenceService from "../services/agenceService";
import authService from "../services/authService";

export default function Agences() {
  const [agences, setAgences] = useState([]);
  const [columns, setColumns] = useState([]);
  const [editId, setEditId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialValues, setInitialValues] = useState(null);
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });
  const user = authService.getCurrentUser();
  const isAdmin = (user?.role || '').toString() === 'Administrateur';

  // Charger la liste des agences
  const loadAgences = async () => {
    try {
      const data = await agenceService.list();
      // Ajouter un numéro d'ordre à chaque agence et renommer les colonnes
      const agencesWithNumber = data.map((agence, index) => ({
        ...agence,
        Numero: index + 1,
        Centre: agence.Nom_Centre,
        Agence: agence.Nom_Agence
      }));
      setAgences(agencesWithNumber);
      // Déduire dynamiquement les colonnes à partir des objets retournés
      const keys = Array.from(
        agencesWithNumber.reduce((acc, row) => {
          Object.keys(row || {}).forEach((k) => acc.add(k));
          return acc;
        }, new Set())
      );
      // Ordonner: champs principaux d'abord, puis le reste trié alpha
      const preferred = [
        'Numero',
        'Centre',
        'Nom_Commune',
        'Agence',
        'Adresse',
        'Telephone',
        'Fax',
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
      const hidden = new Set(['NIF', 'NCI', 'CreatedAt', 'Nom_Banque', 'Compte_Bancaire', 'FK_Centre', 'FK_Commune', 'AgenceId', 'Email', 'Nom_Centre', 'Nom_Agence']);
      const ordered = orderedAll.filter((k) => !hidden.has(k));
      setColumns(ordered);
    } catch (e) {
      console.error('Erreur lors du chargement des agences:', e);
      setToast({ open: true, type: 'error', message: 'Impossible de joindre le serveur. Vérifiez le backend (http://localhost:5000).' });
      setAgences([]);
      setColumns([]);
    }
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
    <div className="p-6 text-gray-800 w-full min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-blue-700">
          Gestion des Agences Commerciales
        </h1>

        {/* ✅ Bouton Ajouter (admin uniquement) */}
        {isAdmin && (
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
        )}
      </div>
      {/* ✅ Modal d'ajout / modification */}
      <AddAgencyModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditId(null); setInitialValues(null); }}
        onSubmit={handleSubmitModal}
        initialValues={initialValues}
      />

      {/* ✅ Tableau des agences (colonnes dynamiques) */}
      <div className="overflow-x-auto bg-white shadow-md rounded-xl border border-blue-100 w-full">
        <table className="w-full border-collapse min-w-full">
          <thead className="bg-blue-100 text-blue-800">
            <tr>
              {columns.map((col) => (
                <th key={col} className="py-3 px-6 text-left whitespace-nowrap font-semibold text-sm">{col}</th>
              ))}
              <th className="py-3 px-6 text-center font-semibold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agences.map((row) => (
              <tr key={row.AgenceId || JSON.stringify(row)} className="border-t hover:bg-blue-50">
                {columns.map((col) => (
                  <td key={col} className="py-2 px-6 whitespace-nowrap text-sm">{String(row[col] ?? '')}</td>
                ))}
                <td className="py-2 px-6 text-center space-x-2">
                  {isAdmin && (
                    <>
                      <button title="Modifier" className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-blue-50" onClick={() => handleEdit(row)}>
                        <Pencil className="h-3.5 w-3.5 text-blue-600" />
                      </button>
                      <button title="Supprimer" className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-red-50" onClick={() => {/* implement delete with confirm & service */}}>
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      </button>
                      <button title="Imprimer" className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100" onClick={() => window.print()}>
                        <Printer className="h-3.5 w-3.5 text-gray-700" />
                      </button>
                    </>
                  )}
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
