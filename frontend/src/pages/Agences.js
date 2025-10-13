import React, { useEffect, useState } from "react";
import { Pencil, Trash2, Printer } from 'lucide-react';
import ConfirmationDialog from '../components/ConfirmationDialog';
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmProps, setConfirmProps] = useState({});
  const [selectedAgence, setSelectedAgence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const user = authService.getCurrentUser();
  const isAdmin = (user?.role || '').toString() === 'Administrateur';
  const canEdit = isAdmin; // Seuls les admins peuvent modifier/supprimer
  
  // Debug: Log user info
  console.log('Agences page - Current user:', user);
  console.log('Agences page - Is admin:', isAdmin);

  // Charger la liste des agences
  const loadAgences = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading agences...');
      
      const data = await agenceService.list();
      console.log('Agences data received:', data);
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Données invalides reçues du serveur');
      }
      
      // Ajouter un numéro d'ordre à chaque agence et renommer les colonnes
      const agencesWithNumber = data.map((agence, index) => ({
        ...agence,
        Numero: index + 1,
        Centre: agence.Nom_Centre,
        Agence: agence.Nom_Agence
      }));
      
      console.log('Agences with numbers:', agencesWithNumber);
      setAgences(agencesWithNumber);
      
      // Déduire dynamiquement les colonnes à partir des objets retournés
      const keys = Array.from(
        agencesWithNumber.reduce((acc, row) => {
          Object.keys(row || {}).forEach((k) => acc.add(k));
          return acc;
        }, new Set())
      );
      
      console.log('Columns keys:', keys);
      
      // Ordonner: champs principaux d'abord, puis le reste trié alpha
      const preferred = [
        'Numero',
        'Centre',
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
      
      console.log('Final columns:', ordered);
      setColumns(ordered);
    } catch (err) {
      console.error('Erreur lors du chargement des agences:', err);
      setError('Erreur lors du chargement des agences: ' + (err?.response?.data?.message || err.message));
      setToast({ open: true, type: 'error', message: 'Erreur lors du chargement des agences' });
    } finally {
      setLoading(false);
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

  const askDelete = (agence) => {
    setSelectedAgence(agence);
    setConfirmProps({
      title: 'Confirmer la suppression',
      message: `Supprimer l\'agence "${agence.Nom_Agence}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      type: 'danger'
    });
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedAgence?.AgenceId) { setConfirmOpen(false); return; }
    try {
      await agenceService.remove(selectedAgence.AgenceId);
      setToast({ open: true, type: 'success', message: 'Agence supprimée avec succès.' });
      await loadAgences();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erreur lors de la suppression.';
      setToast({ open: true, type: 'error', message: msg });
    } finally {
      setConfirmOpen(false);
      setSelectedAgence(null);
    }
  };

  return (
    <div className="p-6 text-gray-800 w-full min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-blue-700">
            Gestion des Agences Commerciales
          </h1>
          {/* Debug info */}
          <div className="text-xs text-gray-500 mt-1">
            Utilisateur: {user ? `${user.username} (${user.role})` : 'Non connecté'} | 
            Admin: {isAdmin ? 'Oui' : 'Non'} | 
            Agences: {agences.length}
          </div>
        </div>

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
      
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Chargement des agences...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
          <h3 className="font-semibold mb-2">Erreur de chargement</h3>
          <p>{error}</p>
          <button 
            onClick={loadAgences}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* ✅ Tableau des agences (colonnes dynamiques) */}
      {!loading && !error && (
        <div className="table-container bg-white shadow-md rounded-xl border border-blue-100 w-full">
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
                      <button title="Supprimer" className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-red-50" onClick={() => askDelete(row)}>
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
      )}

      {/* ✅ Modal d'ajout / modification */}
      <AddAgencyModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditId(null); setInitialValues(null); }}
        onSubmit={handleSubmitModal}
        initialValues={initialValues}
      />

      {/* ✅ Messages bulle (toasts) */}
      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />

      <ConfirmationDialog
        isOpen={confirmOpen}
        title={confirmProps.title}
        message={confirmProps.message}
        confirmText={confirmProps.confirmText}
        type={confirmProps.type}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
