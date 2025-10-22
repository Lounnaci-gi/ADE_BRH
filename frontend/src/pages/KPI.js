import React, { useEffect, useState, useRef } from 'react';
import { Calendar, Building2, Save, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import kpiService from '../services/kpiService';
import authService from '../services/authService';
import { swalSuccess, swalError } from '../utils/swal';

// Composant de sélecteur de date moderne
const ModernDatePicker = ({ value, onChange, placeholder = "Sélectionner une date" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const datePickerRef = useRef(null);

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Ajouter les jours vides du mois précédent
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Ajouter les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    // Corriger le bug de timezone en utilisant les composants locaux de la date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;
    onChange(localDateString);
    setIsOpen(false);
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return placeholder;
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Fermer le picker quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const days = getDaysInMonth(currentMonth);
  const today = new Date();

  return (
    <div className="relative" ref={datePickerRef}>
      {/* Input trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md text-xs text-left flex items-center justify-between min-w-[100px] max-w-[120px]"
      >
        <span className={selectedDate ? 'text-gray-900' : 'text-gray-500'}>
          {formatDisplayDate(value)}
        </span>
        <Calendar className="h-3 w-3 text-gray-400" />
      </button>

      {/* Calendar dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-4 min-w-[280px]">
          {/* Header avec navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            
            <h3 className="text-sm font-semibold text-gray-900">
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map(day => (
              <div key={day} className="text-xs text-gray-500 font-medium text-center py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Grille des jours */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="h-8" />;
              }

              const isToday = day.toDateString() === today.toDateString();
              const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  className={`
                    h-8 w-8 text-xs rounded-lg transition-all duration-150 flex items-center justify-center
                    ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                    ${isToday ? 'bg-blue-100 text-blue-600 font-semibold' : ''}
                    ${isSelected ? 'bg-blue-600 text-white font-semibold' : ''}
                    ${!isSelected && !isToday ? 'hover:bg-gray-100' : ''}
                  `}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Actions rapides */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => handleDateSelect(today)}
              className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Aujourd'hui
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function KPI() {
  const [kpis, setKpis] = useState([]);
  const [agences, setAgences] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sortedCategories, setSortedCategories] = useState([]);
  const [entriesByCategory, setEntriesByCategory] = useState({});
  const [objectives, setObjectives] = useState(null);
  const [allObjectives, setAllObjectives] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);
  // Toast remplacé par SweetAlert2
  const [formData, setFormData] = useState({
    dateKey: '',
    agenceId: '',
    // Encaissement
    encaissementJournalierGlobal: ''
  });

  // Fonction pour trier les catégories dans l'ordre souhaité
  const sortCategories = (categories) => {
    if (!categories || !Array.isArray(categories)) return [];
    const order = ['MENAGE', 'ADMIN', 'ARTCOM', 'IND'];
    return categories.sort((a, b) => {
      const indexA = order.indexOf(a.CodeCategorie);
      const indexB = order.indexOf(b.CodeCategorie);
      return indexA - indexB;
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const user = authService.getCurrentUser();
      const isAdmin = (user?.role || '').toString() === 'Administrateur';
      const userAgenceId = user?.agenceId ? Number(user.agenceId) : null;

      const [kpisData, categoriesData] = await Promise.all([
        kpiService.list(),
        kpiService.getCategories()
      ]);

      let agencesData = await kpiService.getAgences();
      if (!isAdmin && userAgenceId) {
        agencesData = agencesData.filter(a => Number(a.AgenceId) === userAgenceId);
        // Pour les utilisateurs Standard, pré-sélectionner leur agence
        setFormData(prev => ({ ...prev, agenceId: userAgenceId.toString() }));
      }
      setKpis(kpisData || []);
      setAgences(agencesData || []);
      setCategories(categoriesData || []);
      
      // Trier les catégories dans l'ordre souhaité
      const sortedCats = sortCategories(categoriesData || []);
      setSortedCategories(sortedCats);
      // Initialiser les valeurs par catégorie selon FAIT_KPI_ADE
      const init = (categoriesData || []).reduce((acc, cat) => {
        acc[cat.CategorieId] = {
          // Relances
          nbRelancesEnvoyees: '', mtRelancesEnvoyees: '',
          nbRelancesReglees: '', mtRelancesReglees: '',
          // Mises en demeure
          nbMisesEnDemeureEnvoyees: '', mtMisesEnDemeureEnvoyees: '',
          nbMisesEnDemeureReglees: '', mtMisesEnDemeureReglees: '',
          // Dossiers juridiques
          nbDossiersJuridiques: '', mtDossiersJuridiques: '',
          // Coupures
          nbCoupures: '', mtCoupures: '',
          // Rétablissements
          nbRetablissements: '', mtRetablissements: '',
          // Branchements (Nb seulement)
          nbBranchements: '',
          // Compteurs remplacés (Nb seulement)
          nbCompteursRemplaces: '',
          // Contrôles
          nbControles: '',
          // Observation par catégorie
          observation: ''
        };
        return acc;
      }, {});
      setEntriesByCategory(init);
    } catch (e) {
      console.error(e);
      await swalError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger les données existantes
  const loadExistingData = async (dateKey, agenceId) => {
    if (!dateKey || !agenceId) {
      setHasExistingData(false);
      return;
    }
    
    try {
      const date = new Date(dateKey);
      const dateKeyInt = parseInt(
        date.getFullYear().toString() + 
        (date.getMonth() + 1).toString().padStart(2, '0') + 
        date.getDate().toString().padStart(2, '0')
      );
      
      const existingData = await kpiService.getExistingData(dateKeyInt, parseInt(agenceId, 10));
      
      // Réinitialiser les entrées par catégorie
      const init = (sortedCategories || []).reduce((acc, cat) => {
        acc[cat.CategorieId] = {
          // Relances
          nbRelancesEnvoyees: '', mtRelancesEnvoyees: '',
          nbRelancesReglees: '', mtRelancesReglees: '',
          // Mises en demeure
          nbMisesEnDemeureEnvoyees: '', mtMisesEnDemeureEnvoyees: '',
          nbMisesEnDemeureReglees: '', mtMisesEnDemeureReglees: '',
          // Dossiers juridiques
          nbDossiersJuridiques: '', mtDossiersJuridiques: '',
          // Coupures
          nbCoupures: '', mtCoupures: '',
          // Rétablissements
          nbRetablissements: '', mtRetablissements: '',
          // Branchements (Nb seulement)
          nbBranchements: '',
          // Compteurs remplacés (Nb seulement)
          nbCompteursRemplaces: '',
          // Contrôles
          nbControles: '',
          // Observation par catégorie
          observation: ''
        };
        return acc;
      }, {});
      
      // Pré-remplir avec les données existantes
      existingData.forEach(item => {
        if (init[item.CategorieId]) {
          init[item.CategorieId] = {
            // Relances
            nbRelancesEnvoyees: item.Nb_RelancesEnvoyees || '',
            mtRelancesEnvoyees: item.Mt_RelancesEnvoyees || '',
            nbRelancesReglees: item.Nb_RelancesReglees || '',
            mtRelancesReglees: item.Mt_RelancesReglees || '',
            // Mises en demeure
            nbMisesEnDemeureEnvoyees: item.Nb_MisesEnDemeure_Envoyees || '',
            mtMisesEnDemeureEnvoyees: item.Mt_MisesEnDemeure_Envoyees || '',
            nbMisesEnDemeureReglees: item.Nb_MisesEnDemeure_Reglees || '',
            mtMisesEnDemeureReglees: item.Mt_MisesEnDemeure_Reglees || '',
            // Dossiers juridiques
            nbDossiersJuridiques: item.Nb_Dossiers_Juridiques || '',
            mtDossiersJuridiques: item.Mt_Dossiers_Juridiques || '',
            // Coupures
            nbCoupures: item.Nb_Coupures || '',
            mtCoupures: item.Mt_Coupures || '',
            // Rétablissements
            nbRetablissements: item.Nb_Retablissements || '',
            mtRetablissements: item.Mt_Retablissements || '',
            // Branchements (Nb seulement)
            nbBranchements: item.Nb_Branchements || '',
            // Compteurs remplacés (Nb seulement)
            nbCompteursRemplaces: item.Nb_Compteurs_Remplaces || '',
            // Contrôles
            nbControles: item.Nb_Controles || '',
            // Observation par catégorie
            observation: item.Observation || ''
          };
        }
      });
      
      setEntriesByCategory(init);
      
      // Renseigner l'encaissement journalier global unique si disponible (valeur du jour, non sommée)
      if (existingData && existingData.length > 0) {
        setHasExistingData(true);
        const encVals = existingData
          .map(r => r.Encaissement_Journalier_Global)
          .filter(v => v != null && v !== '');
        if (encVals.length > 0) {
          const uniqueEnc = encVals[0];
          setFormData(prev => ({ ...prev, encaissementJournalierGlobal: uniqueEnc }));
        }
      } else {
        // Aucune donnée existante - vider les champs
        setHasExistingData(false);
        setFormData(prev => ({ 
          ...prev, 
          encaissementJournalierGlobal: ''
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données existantes:', error);
    }
  };

  useEffect(() => {
    // Pré-remplir la date du jour au chargement
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setFormData(prev => ({ ...prev, dateKey: `${yyyy}-${mm}-${dd}` }));
    loadData();
  }, []); // Remove loadData from dependencies to prevent infinite loop

  // Fonction pour charger les objectifs
  const loadObjectives = async (agenceId, date) => {
    if (!agenceId || !date) return;
    
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const objectivesData = await kpiService.getObjectives(agenceId, year, month);
      setObjectives(objectivesData);
    } catch (error) {
      console.error('Erreur lors du chargement des objectifs:', error);
      setObjectives(null);
    }
  };

  // Fonction pour charger tous les objectifs de l'agence
  const loadAllObjectives = async (agenceId) => {
    if (!agenceId) return;
    
    try {
      const allObjectivesData = await kpiService.getAllObjectives(agenceId);
      setAllObjectives(allObjectivesData);
    } catch (error) {
      console.error('Erreur lors du chargement de tous les objectifs:', error);
      setAllObjectives([]);
    }
  };

  // Fonction pour charger le résumé des données
  const loadSummary = async (agenceId, dateKey) => {
    if (!agenceId || !dateKey) return;
    
    try {
      const date = new Date(dateKey);
      const dateKeyInt = parseInt(
        date.getFullYear().toString() + 
        (date.getMonth() + 1).toString().padStart(2, '0') + 
        date.getDate().toString().padStart(2, '0')
      );
      
      const summaryData = await kpiService.getSummary(agenceId, dateKeyInt);
      setSummary(summaryData);
    } catch (error) {
      console.error('Erreur lors du chargement du résumé:', error);
      setSummary(null);
    }
  };

  // Charger les données existantes quand la date ou l'agence change
  useEffect(() => {
    if (formData.dateKey && formData.agenceId && sortedCategories && sortedCategories.length > 0) {
      loadExistingData(formData.dateKey, formData.agenceId);
      loadObjectives(formData.agenceId, new Date(formData.dateKey));
      loadSummary(formData.agenceId, formData.dateKey);
    }
  }, [formData.dateKey, formData.agenceId, sortedCategories]);

  // Charger tous les objectifs quand l'agence change
  useEffect(() => {
    if (formData.agenceId) {
      loadAllObjectives(formData.agenceId);
    }
  }, [formData.agenceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.dateKey || !formData.agenceId) {
      await swalError('Date et Agence sont requis', 'Validation');
      return;
    }

    try {
      // Convertir la date en DateKey (format YYYYMMDD)
      const date = new Date(formData.dateKey);
      const dateKey = parseInt(
        date.getFullYear().toString() + 
        (date.getMonth() + 1).toString().padStart(2, '0') + 
        date.getDate().toString().padStart(2, '0')
      );

      // Pour chaque catégorie, envoyer une entrée si au moins un champ pertinent est renseigné
      const agenceIdNum = parseInt(formData.agenceId);
      const creates = (sortedCategories || []).map(async (cat) => {
        const catId = parseInt(cat.CategorieId);
        const e = entriesByCategory[cat.CategorieId] || {};
        // Considérer TOUTES les familles de champs supportées par le backend
        const hasData = [
          e.nbRelancesEnvoyees, e.mtRelancesEnvoyees,
          e.nbRelancesReglees, e.mtRelancesReglees,
          e.nbMisesEnDemeureEnvoyees, e.mtMisesEnDemeureEnvoyees,
          e.nbMisesEnDemeureReglees, e.mtMisesEnDemeureReglees,
          e.nbDossiersJuridiques, e.mtDossiersJuridiques,
          e.nbCoupures, e.mtCoupures,
          e.nbRetablissements, e.mtRetablissements,
          e.nbBranchements,
          e.nbCompteursRemplaces,
          e.nbControles
        ].some((v) => v !== '' && v != null);
        if (!hasData) return null;
        const payload = {
          dateKey,
          agenceId: agenceIdNum,
          categorieId: catId,
          // Champs supportés par le backend selon FAIT_KPI_ADE
          // Relances
          nbRelancesEnvoyees: parseInt(e.nbRelancesEnvoyees || 0, 10),
          mtRelancesEnvoyees: parseFloat(e.mtRelancesEnvoyees || 0),
          nbRelancesReglees: parseInt(e.nbRelancesReglees || 0, 10),
          mtRelancesReglees: parseFloat(e.mtRelancesReglees || 0),
          // Mises en demeure
          nbMisesEnDemeureEnvoyees: parseInt(e.nbMisesEnDemeureEnvoyees || 0, 10),
          mtMisesEnDemeureEnvoyees: parseFloat(e.mtMisesEnDemeureEnvoyees || 0),
          nbMisesEnDemeureReglees: parseInt(e.nbMisesEnDemeureReglees || 0, 10),
          mtMisesEnDemeureReglees: parseFloat(e.mtMisesEnDemeureReglees || 0),
          // Dossiers juridiques
          nbDossiersJuridiques: parseInt(e.nbDossiersJuridiques || 0, 10),
          mtDossiersJuridiques: parseFloat(e.mtDossiersJuridiques || 0),
          // Coupures
          nbCoupures: parseInt(e.nbCoupures || 0, 10),
          mtCoupures: parseFloat(e.mtCoupures || 0),
          // Rétablissements
          nbRetablissements: parseInt(e.nbRetablissements || 0, 10),
          mtRetablissements: parseFloat(e.mtRetablissements || 0),
          // Branchements (Nb seulement)
          nbBranchements: parseInt(e.nbBranchements || 0, 10),
          // Compteurs remplacés (Nb seulement)
          nbCompteursRemplaces: parseInt(e.nbCompteursRemplaces || 0, 10),
          // Contrôles
          nbControles: parseInt(e.nbControles || 0, 10),
          // Observation par catégorie
          observation: e.observation || '',
          // Encaissement global: optionnel (envoyé s'il existe au niveau formulaire)
          encaissementJournalierGlobal: parseFloat(formData.encaissementJournalierGlobal || 0)
        };
        return kpiService.create(payload);
      });

      // Filtrer les catégories sans données
      const requests = (await Promise.all(creates)).filter(Boolean);
      if (requests.length === 0) {
        await swalError('Aucune donnée à enregistrer. Remplissez au moins un champ.');
        return;
      }
      await swalSuccess('Données sauvegardées avec succès');
      
      // Réinitialiser le formulaire (date du jour conservée, agence préservée pour Standard)
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      
      const user = authService.getCurrentUser();
      const isAdmin = (user?.role || '').toString() === 'Administrateur';
      const userAgenceId = user?.agenceId ? Number(user.agenceId) : null;
      
      setFormData({
        dateKey: `${y}-${m}-${d}`,
        agenceId: isAdmin ? '' : (userAgenceId ? userAgenceId.toString() : ''),
        encaissementJournalierGlobal: ''
      });
      // Réinitialiser les valeurs par catégorie
      const initEmpty = Object.keys(entriesByCategory || {}).reduce((acc, key) => {
        acc[key] = {
          // Relances
          nbRelancesEnvoyees: '', mtRelancesEnvoyees: '',
          nbRelancesReglees: '', mtRelancesReglees: '',
          // Mises en demeure
          nbMisesEnDemeureEnvoyees: '', mtMisesEnDemeureEnvoyees: '',
          nbMisesEnDemeureReglees: '', mtMisesEnDemeureReglees: '',
          // Dossiers juridiques
          nbDossiersJuridiques: '', mtDossiersJuridiques: '',
          // Coupures
          nbCoupures: '', mtCoupures: '',
          // Rétablissements
          nbRetablissements: '', mtRetablissements: '',
          // Branchements (Nb seulement)
          nbBranchements: '',
          // Compteurs remplacés (Nb seulement)
          nbCompteursRemplaces: '',
          // Contrôles
          nbControles: ''
        };
        return acc;
      }, {});
      setEntriesByCategory(initEmpty);
      
      await loadData();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Une erreur est survenue';
      await swalError(msg);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '0';
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD'
    }).format(value);
  };


  // Fonction pour calculer le taux de réalisation
  const calculateCompletionRate = (actual, objective) => {
    if (!objective || objective === 0) return null;
    const rate = (actual / objective) * 100;
    return Math.round(rate * 100) / 100; // Arrondir à 2 décimales
  };

  // Fonction pour obtenir la couleur du taux de réalisation
  const getCompletionRateColor = (rate) => {
    if (rate === null) return 'text-gray-500 bg-gray-100';
    if (rate >= 100) return 'text-green-600 bg-green-100';
    if (rate >= 80) return 'text-yellow-600 bg-yellow-100';
    if (rate >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  // Fonction pour formater les dates
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };


  return (
    <div className="p-6">

      <div className="grid grid-cols-1 gap-6">
        {/* Objectifs de l'agence */}
        {formData.agenceId && (
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-sky-50 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-sky-800">Objectifs de l'agence</h3>
              {allObjectives.length > 0 && (
                <span className="text-sm text-sky-600 bg-sky-100 px-3 py-1 rounded-full">
                  {allObjectives.length} objectif{allObjectives.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            {allObjectives.length > 0 ? (
              <div className="space-y-4">
                {allObjectives.map((objective, index) => (
                  <div key={objective.ObjectifId || index} className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-800">{objective.Titre || `Objectif ${index + 1}`}</h4>
                        {objective.Description && (
                          <p className="text-sm text-gray-600 mt-1">{objective.Description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Période</div>
                        <div className="text-sm font-medium text-gray-700">
                          {formatDate(objective.DateDebut)} - {formatDate(objective.DateFin)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                      <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                        <div className="text-xs text-emerald-600 font-medium mb-1">Encaissement</div>
                        <div className="text-lg font-bold text-emerald-800">
                          {objective.Obj_Encaissement ? `${objective.Obj_Encaissement.toLocaleString('fr-FR')} DA` : '0 DA'}
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="text-xs text-blue-600 font-medium mb-1">Relances</div>
                        <div className="text-lg font-bold text-blue-800">{objective.Obj_Relances || 0}</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <div className="text-xs text-green-600 font-medium mb-1">Mises en demeure</div>
                        <div className="text-lg font-bold text-green-800">{objective.Obj_MisesEnDemeure || 0}</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <div className="text-xs text-purple-600 font-medium mb-1">Dossiers juridiques</div>
                        <div className="text-lg font-bold text-purple-800">{objective.Obj_Dossiers_Juridiques || 0}</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                        <div className="text-xs text-orange-600 font-medium mb-1">Coupures</div>
                        <div className="text-lg font-bold text-orange-800">{objective.Obj_Coupures || 0}</div>
                      </div>
                      <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-200">
                        <div className="text-xs text-cyan-600 font-medium mb-1">Contrôles</div>
                        <div className="text-lg font-bold text-cyan-800">{objective.Obj_Controles || 0}</div>
                      </div>
                      <div className="bg-pink-50 rounded-lg p-3 border border-pink-200">
                        <div className="text-xs text-pink-600 font-medium mb-1">Compteurs remplacés</div>
                        <div className="text-lg font-bold text-pink-800">{objective.Obj_Compteurs_Remplaces || 0}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-sky-600">
                <div className="text-sm">Aucun objectif défini pour cette agence</div>
                <div className="text-xs text-gray-500 mt-1">Les objectifs sont définis dans la section Objectifs</div>
              </div>
            )}
          </div>
        )}

        {/* Formulaire élargi avec style élégant */}
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 rounded-3xl shadow-xl p-8 border border-blue-100/50 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800">Saisie des données</h2>
            <p className="text-sm text-gray-600">Enregistrez les indicateurs quotidiens par catégorie</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Informations de base avec style amélioré */}
            <div className="space-y-3">
              {/* Sélecteur d'agence - visible seulement pour les Administrateurs */}
              {(() => {
                const user = authService.getCurrentUser();
                const isAdmin = (user?.role || '').toString() === 'Administrateur';
                
                if (isAdmin) {
                  return (
                    <div className="space-y-1">
                      <label className="flex items-center text-xs font-semibold text-gray-700 mb-1">
                        <div className="p-1 bg-green-100 rounded mr-2">
                          <Building2 className="h-3 w-3 text-green-600" />
                        </div>
                        Agence *
                      </label>
                      <select
                        value={formData.agenceId}
                        onChange={(e) => setFormData({ ...formData, agenceId: e.target.value })}
                        className="w-full border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md text-xs max-w-[200px]"
                        required
                      >
                        <option value="">Sélectionner une agence</option>
                        {agences.map(agence => (
                          <option key={agence.AgenceId} value={agence.AgenceId}>
                            {agence.Nom_Agence}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                } else {
                  // Pour les utilisateurs Standard, afficher l'agence en lecture seule
                  const userAgence = agences.find(a => Number(a.AgenceId) === Number(formData.agenceId));
                  return (
                    <div className="space-y-1">
                      <label className="flex items-center text-xs font-semibold text-gray-700 mb-1">
                        <div className="p-1 bg-green-100 rounded mr-2">
                          <Building2 className="h-3 w-3 text-green-600" />
                        </div>
                        Agence assignée
                      </label>
                      <div className="w-full border border-gray-200 rounded px-2 py-1 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 shadow-sm text-xs max-w-[200px]">
                        {userAgence ? userAgence.Nom_Agence : 'Chargement...'}
                      </div>
                    </div>
                  );
                }
              })()}

              {/* Champ de date */}
              <div className="space-y-1">
                <label className="flex items-center text-xs font-semibold text-gray-700 mb-1">
                  <div className="p-1 bg-blue-100 rounded mr-2">
                    <Calendar className="h-3 w-3 text-blue-600" />
                  </div>
                  Date *
                </label>
                <ModernDatePicker
                  value={formData.dateKey}
                  onChange={(date) => setFormData({ ...formData, dateKey: date })}
                  placeholder="Sélectionner une date"
                />
              </div>
            </div>

            {/* Saisie par catégorie avec design compact et professionnel */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Saisie par catégorie</h3>
              </div>
              
              {/* Design en cartes groupées par type d'opération */}
              <div className="space-y-6">
                {(sortedCategories || []).map((cat, index) => {
                  const e = entriesByCategory[cat.CategorieId] || {};
                  return (
                    <div key={cat.CategorieId} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                      {/* En-tête de catégorie */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 rounded-t-xl border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-800">{cat.Libelle}</h4>
                      </div>
                      
                      {/* Contenu organisé en sections */}
                      <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                          
                          {/* Section Relances */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                              <h5 className="font-semibold text-cyan-700 text-sm">Relances</h5>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Envoyées (Nb)</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  step="1"
                                  value={e.nbRelancesEnvoyees || ''} 
                                  onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbRelancesEnvoyees: ev.target.value } }))} 
                                  className="w-full border border-cyan-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200" 
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Envoyées (Mt)</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  value={e.mtRelancesEnvoyees || ''} 
                                  onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtRelancesEnvoyees: ev.target.value } }))} 
                                  className="w-full border border-cyan-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200" 
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Réglées (Nb)</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  step="1"
                                  value={e.nbRelancesReglees || ''} 
                                  onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbRelancesReglees: ev.target.value } }))} 
                                  className="w-full border border-cyan-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition-all duration-200" 
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Réglées (Mt)</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  value={e.mtRelancesReglees || ''} 
                                  onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtRelancesReglees: ev.target.value } }))} 
                                  className="w-full border border-cyan-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition-all duration-200" 
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section Mises en demeure */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                              <h5 className="font-semibold text-yellow-700 text-sm">Mises en demeure</h5>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Envoyées (Nb)</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  step="1"
                                  value={e.nbMisesEnDemeureEnvoyees || ''} 
                                  onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbMisesEnDemeureEnvoyees: ev.target.value } }))} 
                                  className="w-full border border-yellow-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200" 
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Envoyées (Mt)</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  value={e.mtMisesEnDemeureEnvoyees || ''} 
                                  onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtMisesEnDemeureEnvoyees: ev.target.value } }))} 
                                  className="w-full border border-yellow-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200" 
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Réglées (Nb)</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  step="1"
                                  value={e.nbMisesEnDemeureReglees || ''} 
                                  onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbMisesEnDemeureReglees: ev.target.value } }))} 
                                  className="w-full border border-yellow-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent transition-all duration-200" 
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Réglées (Mt)</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  value={e.mtMisesEnDemeureReglees || ''} 
                                  onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtMisesEnDemeureReglees: ev.target.value } }))} 
                                  className="w-full border border-yellow-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent transition-all duration-200" 
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section Activité Juridique */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                              <h5 className="font-semibold text-orange-700 text-sm">Activité Juridique</h5>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Dossiers juridiques (Nb)</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  step="1"
                                  value={e.nbDossiersJuridiques || ''} 
                                  onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbDossiersJuridiques: ev.target.value } }))} 
                                  className="w-full border border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200" 
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Dossiers juridiques (Mt)</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  value={e.mtDossiersJuridiques || ''} 
                                  onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtDossiersJuridiques: ev.target.value } }))} 
                                  className="w-full border border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200" 
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section Activité Coupure & Rétablissement */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                              <h5 className="font-semibold text-red-700 text-sm">Activité Coupure & Rétablissement</h5>
                            </div>
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-gray-600 mb-1 block">Coupures (Nb)</label>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    step="1"
                                    value={e.nbCoupures || ''} 
                                    onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbCoupures: ev.target.value } }))} 
                                    className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200" 
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-600 mb-1 block">Coupures (Mt)</label>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    step="0.01" 
                                    value={e.mtCoupures || ''} 
                                    onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtCoupures: ev.target.value } }))} 
                                    className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200" 
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-gray-600 mb-1 block">Rétablissements (Nb)</label>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    step="1"
                                    value={e.nbRetablissements || ''} 
                                    onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbRetablissements: ev.target.value } }))} 
                                    className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-600 mb-1 block">Rétablissements (Mt)</label>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    step="0.01" 
                                    value={e.mtRetablissements || ''} 
                                    onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtRetablissements: ev.target.value } }))} 
                                    className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Section Gestion des Compteurs */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                              <h5 className="font-semibold text-purple-700 text-sm">Gestion des Compteurs</h5>
                            </div>
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-gray-600 mb-1 block">Branchements</label>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    step="1"
                                    value={e.nbBranchements || ''} 
                                    onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbBranchements: ev.target.value } }))} 
                                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-600 mb-1 block">Compteurs remplacés</label>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    step="1"
                                    value={e.nbCompteursRemplaces || ''} 
                                    onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbCompteursRemplaces: ev.target.value } }))} 
                                    className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200" 
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                <div>
                                  <label className="text-xs text-gray-600 mb-1 block">Contrôles</label>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    step="1"
                                    value={e.nbControles || ''} 
                                    onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbControles: ev.target.value } }))} 
                                    className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200" 
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Champ Observation par catégorie */}
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <h6 className="font-medium text-gray-600 text-xs">Observation</h6>
                            </div>
                            <textarea
                              value={e.observation || ''}
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], observation: ev.target.value } }))}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-transparent transition-all duration-200 resize-none"
                              rows="2"
                              placeholder="Ajoutez une observation pour cette catégorie..."
                              maxLength="200"
                            />
                            <div className="text-right mt-1">
                              <span className="text-xs text-gray-400">
                                {(e.observation || '').length}/200 caractères
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Champ Encaissement Journalier Global */}
            <div className="border-t border-gray-200 pt-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                  </div>
                  Encaissement Journalier Global (optionnel)
                </label>
                <div className="flex justify-start">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={hasExistingData ? formData.encaissementJournalierGlobal : ''}
                    onChange={(e) => setFormData({ ...formData, encaissementJournalierGlobal: e.target.value })}
                    className="w-64 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                    placeholder="Montant de l'encaissement journalier global..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 inline-flex items-center gap-2 font-medium text-sm transform hover:scale-105"
              >
                <Save className="h-4 w-4" />
                Sauvegarder
              </button>
            </div>
          </form>
        </div>

        

        {/* Résumé des données de l'agence */}
        {formData.agenceId && formData.dateKey && (
          <div className="bg-white rounded-2xl shadow p-6 border border-blue-50">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Résumé des données - {agences.find(a => Number(a.AgenceId) === Number(formData.agenceId))?.Nom_Agence || 'Agence'}
            </h2>
            
            {summary && summary.daily ? (
              <div className="space-y-6">
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Relances */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="text-sm text-blue-600 font-medium mb-2 flex items-center justify-between">
                        <span>Relances</span>
                        {summary.objectives && summary.objectives.Obj_Relances && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${getCompletionRateColor(calculateCompletionRate(summary.daily.Total_RelancesEnvoyees, summary.objectives.Obj_Relances))}`}>
                            {calculateCompletionRate(summary.daily.Total_RelancesEnvoyees, summary.objectives.Obj_Relances) !== null 
                              ? `${calculateCompletionRate(summary.daily.Total_RelancesEnvoyees, summary.objectives.Obj_Relances)}%`
                              : 'N/A'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Envoyées:</span>
                          <span className="font-semibold">{summary.daily.Total_RelancesEnvoyees || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Réglées:</span>
                          <span className="font-semibold">{summary.daily.Total_RelancesReglees || 0}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Montant envoyé:</span>
                          <span>{formatCurrency(summary.daily.Total_Mt_RelancesEnvoyees || 0)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Montant réglé:</span>
                          <span>{formatCurrency(summary.daily.Total_Mt_RelancesReglees || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Mises en demeure */}
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="text-sm text-green-600 font-medium mb-2 flex items-center justify-between">
                        <span>Mises en demeure</span>
                        {summary.objectives && summary.objectives.Obj_MisesEnDemeure && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${getCompletionRateColor(calculateCompletionRate(summary.daily.Total_MisesEnDemeureEnvoyees, summary.objectives.Obj_MisesEnDemeure))}`}>
                            {calculateCompletionRate(summary.daily.Total_MisesEnDemeureEnvoyees, summary.objectives.Obj_MisesEnDemeure) !== null 
                              ? `${calculateCompletionRate(summary.daily.Total_MisesEnDemeureEnvoyees, summary.objectives.Obj_MisesEnDemeure)}%`
                              : 'N/A'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Envoyées:</span>
                          <span className="font-semibold">{summary.daily.Total_MisesEnDemeureEnvoyees || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Réglées:</span>
                          <span className="font-semibold">{summary.daily.Total_MisesEnDemeureReglees || 0}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Montant envoyé:</span>
                          <span>{formatCurrency(summary.daily.Total_Mt_MisesEnDemeureEnvoyees || 0)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Montant réglé:</span>
                          <span>{formatCurrency(summary.daily.Total_Mt_MisesEnDemeureReglees || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Dossiers juridiques */}
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <div className="text-sm text-purple-600 font-medium mb-2 flex items-center justify-between">
                        <span>Dossiers juridiques</span>
                        {summary.objectives && summary.objectives.Obj_Dossiers_Juridiques && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${getCompletionRateColor(calculateCompletionRate(summary.daily.Total_DossiersJuridiques, summary.objectives.Obj_Dossiers_Juridiques))}`}>
                            {calculateCompletionRate(summary.daily.Total_DossiersJuridiques, summary.objectives.Obj_Dossiers_Juridiques) !== null 
                              ? `${calculateCompletionRate(summary.daily.Total_DossiersJuridiques, summary.objectives.Obj_Dossiers_Juridiques)}%`
                              : 'N/A'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Nombre:</span>
                          <span className="font-semibold">{summary.daily.Total_DossiersJuridiques || 0}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Montant:</span>
                          <span>{formatCurrency(summary.daily.Total_Mt_DossiersJuridiques || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Coupures */}
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <div className="text-sm text-orange-600 font-medium mb-2 flex items-center justify-between">
                        <span>Coupures</span>
                        {summary.objectives && summary.objectives.Obj_Coupures && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${getCompletionRateColor(calculateCompletionRate(summary.daily.Total_Coupures, summary.objectives.Obj_Coupures))}`}>
                            {calculateCompletionRate(summary.daily.Total_Coupures, summary.objectives.Obj_Coupures) !== null 
                              ? `${calculateCompletionRate(summary.daily.Total_Coupures, summary.objectives.Obj_Coupures)}%`
                              : 'N/A'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Nombre:</span>
                          <span className="font-semibold">{summary.daily.Total_Coupures || 0}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Montant:</span>
                          <span>{formatCurrency(summary.daily.Total_Mt_Coupures || 0)}</span>
                        </div>
                      </div>
                    </div>


                    {/* Encaissement global */}
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                      <div className="text-sm text-emerald-600 font-medium mb-2 flex items-center justify-between">
                        <span>Encaissement du jour</span>
                        {summary.objectives && (
                          <span className={`text-xs font-bold ${getCompletionRateColor(calculateCompletionRate(summary.daily.Total_EncaissementGlobal, summary.objectives.Obj_Encaissement))}`}>
                            {calculateCompletionRate(summary.daily.Total_EncaissementGlobal, summary.objectives.Obj_Encaissement) !== null 
                              ? `${calculateCompletionRate(summary.daily.Total_EncaissementGlobal, summary.objectives.Obj_Encaissement)}%`
                              : 'N/A'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Montant journalier:</span>
                          <span className="font-semibold text-emerald-700">{formatCurrency(Number(summary.daily.Total_EncaissementGlobal) || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Compteurs remplacés */}
                    <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                      <div className="text-sm text-pink-600 font-medium mb-2 flex items-center justify-between">
                        <span>Compteurs remplacés</span>
                        {summary.objectives && summary.objectives.Obj_Compteurs_Remplaces && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${getCompletionRateColor(calculateCompletionRate(summary.daily.Total_CompteursRemplaces, summary.objectives.Obj_Compteurs_Remplaces))}`}>
                            {calculateCompletionRate(summary.daily.Total_CompteursRemplaces, summary.objectives.Obj_Compteurs_Remplaces) !== null 
                              ? `${calculateCompletionRate(summary.daily.Total_CompteursRemplaces, summary.objectives.Obj_Compteurs_Remplaces)}%`
                              : 'N/A'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Nombre:</span>
                          <span className="font-semibold text-pink-700">{summary.daily.Total_CompteursRemplaces || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Rétablissement */}
                    <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                      <div className="text-sm text-cyan-600 font-medium mb-2">
                        <span>Rétablissement</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Nombre:</span>
                          <span className="font-semibold text-cyan-700">{summary.daily.Total_Retablissements || 0}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Montant:</span>
                          <span>{formatCurrency(summary.daily.Total_Mt_Retablissements || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Contrôle */}
                    <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                      <div className="text-sm text-teal-600 font-medium mb-2 flex items-center justify-between">
                        <span>Contrôle</span>
                        {summary.objectives && summary.objectives.Obj_Controles && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${getCompletionRateColor(calculateCompletionRate(summary.daily.Total_Controles, summary.objectives.Obj_Controles))}`}>
                            {calculateCompletionRate(summary.daily.Total_Controles, summary.objectives.Obj_Controles) !== null 
                              ? `${calculateCompletionRate(summary.daily.Total_Controles, summary.objectives.Obj_Controles)}%`
                              : 'N/A'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Nombre:</span>
                          <span className="font-semibold text-teal-700">{summary.daily.Total_Controles || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diagrammes de Progression des Objectifs */}
                {summary.objectives && (
                  <div className="mt-8">
                    <h3 className="text-md font-medium text-gray-700 mb-6 flex items-center gap-2">
                      <span className="text-lg">📊</span>
                      Progression des Objectifs
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                      {/* Relances Progress Chart */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="text-center">
                          <div className="text-xs text-blue-700 font-semibold mb-4 flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Relances
                          </div>
                          <div className="relative w-28 h-28 mx-auto mb-4">
                            <svg className="w-28 h-28 transform -rotate-90 drop-shadow-sm" viewBox="0 0 36 36">
                              <path
                                className="text-blue-200"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className="text-blue-500"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${calculateCompletionRate(summary.daily.Total_RelancesEnvoyees, summary.objectives.Obj_Relances) || 0}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div className={`text-xl font-bold ${getCompletionRateColor(calculateCompletionRate(summary.daily.Total_RelancesEnvoyees, summary.objectives.Obj_Relances)).split(' ')[0]}`}>
                                  {calculateCompletionRate(summary.daily.Total_RelancesEnvoyees, summary.objectives.Obj_Relances) || 0}%
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-blue-600 font-medium bg-blue-50 rounded-full px-3 py-1">
                            {summary.daily.Total_RelancesEnvoyees || 0}
                          </div>
                        </div>
                      </div>

                      {/* Mises en demeure Progress Chart */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="text-center">
                          <div className="text-xs text-green-700 font-semibold mb-4 flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Mises en demeure
                          </div>
                          <div className="relative w-28 h-28 mx-auto mb-4">
                            <svg className="w-28 h-28 transform -rotate-90 drop-shadow-sm" viewBox="0 0 36 36">
                              <path
                                className="text-green-200"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className="text-green-500"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${calculateCompletionRate(summary.daily.Total_MisesEnDemeureEnvoyees, summary.objectives.Obj_MisesEnDemeure) || 0}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div className={`text-xl font-bold ${getCompletionRateColor(calculateCompletionRate(summary.daily.Total_MisesEnDemeureEnvoyees, summary.objectives.Obj_MisesEnDemeure)).split(' ')[0]}`}>
                                  {calculateCompletionRate(summary.daily.Total_MisesEnDemeureEnvoyees, summary.objectives.Obj_MisesEnDemeure) || 0}%
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-green-600 font-medium bg-green-50 rounded-full px-3 py-1">
                            {summary.daily.Total_MisesEnDemeureEnvoyees || 0}
                          </div>
                        </div>
                      </div>

                      {/* Dossiers juridiques Progress Chart */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="text-center">
                          <div className="text-xs text-purple-700 font-semibold mb-4 flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            Dossiers Transmis
                          </div>
                          <div className="relative w-28 h-28 mx-auto mb-4">
                            <svg className="w-28 h-28 transform -rotate-90 drop-shadow-sm" viewBox="0 0 36 36">
                              <path
                                className="text-purple-200"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className="text-purple-500"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${calculateCompletionRate(summary.daily.Total_DossiersJuridiques, summary.objectives.Obj_Dossiers_Juridiques) || 0}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div className={`text-xl font-bold ${getCompletionRateColor(calculateCompletionRate(summary.daily.Total_DossiersJuridiques, summary.objectives.Obj_Dossiers_Juridiques)).split(' ')[0]}`}>
                                  {calculateCompletionRate(summary.daily.Total_DossiersJuridiques, summary.objectives.Obj_Dossiers_Juridiques) || 0}%
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-purple-600 font-medium bg-purple-50 rounded-full px-3 py-1">
                            {summary.daily.Total_DossiersJuridiques || 0}
                          </div>
                        </div>
                      </div>

                      {/* Coupures Progress Chart */}
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="text-center">
                          <div className="text-xs text-orange-700 font-semibold mb-4 flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            Coupures
                          </div>
                          <div className="relative w-28 h-28 mx-auto mb-4">
                            <svg className="w-28 h-28 transform -rotate-90 drop-shadow-sm" viewBox="0 0 36 36">
                              <path
                                className="text-orange-200"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className="text-orange-500"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${calculateCompletionRate(summary.daily.Total_Coupures, summary.objectives.Obj_Coupures) || 0}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div className={`text-xl font-bold ${getCompletionRateColor(calculateCompletionRate(summary.daily.Total_Coupures, summary.objectives.Obj_Coupures)).split(' ')[0]}`}>
                                  {calculateCompletionRate(summary.daily.Total_Coupures, summary.objectives.Obj_Coupures) || 0}%
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-orange-600 font-medium bg-orange-50 rounded-full px-3 py-1">
                            {summary.daily.Total_Coupures || 0}
                          </div>
                        </div>
                      </div>

                      {/* Encaissement Progress Chart */}
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="text-center">
                          <div className="text-xs text-emerald-700 font-semibold mb-4 flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            Encaissement
                          </div>
                          <div className="relative w-28 h-28 mx-auto mb-4">
                            <svg className="w-28 h-28 transform -rotate-90 drop-shadow-sm" viewBox="0 0 36 36">
                              <path
                                className="text-emerald-200"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className="text-emerald-500"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${calculateCompletionRate(summary.daily.Total_EncaissementGlobal, summary.objectives.Obj_Encaissement) || 0}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div className={`text-xl font-bold ${getCompletionRateColor(calculateCompletionRate(summary.daily.Total_EncaissementGlobal, summary.objectives.Obj_Encaissement)).split(' ')[0]}`}>
                                  {calculateCompletionRate(summary.daily.Total_EncaissementGlobal, summary.objectives.Obj_Encaissement) || 0}%
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-emerald-600 font-medium bg-emerald-50 rounded-full px-3 py-1">
                            {formatCurrency(summary.daily.Total_EncaissementGlobal || 0)}
                          </div>
                        </div>
                      </div>

                      {/* Compteurs remplacés Progress Chart */}
                      <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-6 border border-pink-200 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="text-center">
                          <div className="text-xs text-pink-700 font-semibold mb-4 flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                            Cpts remplacés
                          </div>
                          <div className="relative w-28 h-28 mx-auto mb-4">
                            <svg className="w-28 h-28 transform -rotate-90 drop-shadow-sm" viewBox="0 0 36 36">
                              <path
                                className="text-pink-200"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className="text-pink-500"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${calculateCompletionRate(summary.daily.Total_CompteursRemplaces, summary.objectives.Obj_Compteurs_Remplaces) || 0}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div className={`text-xl font-bold ${getCompletionRateColor(calculateCompletionRate(summary.daily.Total_CompteursRemplaces, summary.objectives.Obj_Compteurs_Remplaces)).split(' ')[0]}`}>
                                  {calculateCompletionRate(summary.daily.Total_CompteursRemplaces, summary.objectives.Obj_Compteurs_Remplaces) || 0}%
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-pink-600 font-medium bg-pink-50 rounded-full px-3 py-1">
                            {summary.daily.Total_CompteursRemplaces || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Aucune donnée enregistrée pour cette agence à cette date.</p>
              </div>
              )}
            </div>
          )}
      </div>

      {/* Notifications gérées via SweetAlert2 */}
    </div>
  );
}

export default KPI;
