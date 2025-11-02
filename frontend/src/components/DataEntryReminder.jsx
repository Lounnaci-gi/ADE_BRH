import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import kpiService from '../services/kpiService';
import { swal } from '../utils/swal';
import { convertDateToYYYYMMDD } from '../utils/dateUtils';

/**
 * Composant global de rappel de saisie des données KPI
 * Affiche une alerte toutes les 10 minutes à partir de 14:00
 * pour rappeler aux utilisateurs standard de saisir leurs données du jour
 */
function DataEntryReminder() {
  const alertCheckIntervalRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = authService.getCurrentUser();
    const isAdmin = (user?.role || '').toString() === 'Administrateur';
    const userAgenceId = user?.agenceId ? Number(user.agenceId) : null;

    // Ne pas activer l'alerte si l'utilisateur n'est pas authentifié
    if (!authService.isAuthenticated()) {
      return;
    }

    // Ne pas activer l'alerte pour les administrateurs ou si pas d'agence
    if (isAdmin || !userAgenceId) {
      return;
    }

    // Variable pour stocker les agences (chargées asynchronement)
    let agencesCache = [];

    // Fonction pour charger les agences si nécessaire
    const loadAgences = async () => {
      try {
        if (agencesCache.length === 0) {
          agencesCache = await kpiService.getAgences();
        }
      } catch (error) {
        console.error('Erreur lors du chargement des agences:', error);
      }
      return agencesCache;
    };

    // Fonction pour vérifier si les données du jour existent
    const checkTodayData = async () => {
      try {
        const today = new Date();
        const hours = today.getHours();
        
        // Vérifier si on est après 14:00
        if (hours < 14) {
          return; // Pas encore 14h00, ne pas vérifier
        }

        // Obtenir la date du jour au format YYYYMMDD
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayDateKey = convertDateToYYYYMMDD(`${yyyy}-${mm}-${dd}`);
        
        // Vérifier si les données existent pour aujourd'hui
        const existingData = await kpiService.getExistingData(todayDateKey, userAgenceId);
        
        // Si aucune donnée n'existe, afficher l'alerte
        if (!existingData || existingData.length === 0) {
          // Charger les agences pour obtenir le nom
          const agences = await loadAgences();
          const agence = agences.find(a => Number(a.AgenceId) === userAgenceId);
          const agenceName = agence ? agence.Nom_Agence : 'votre agence';
          
          // Vérifier si une alerte n'est pas déjà affichée
          if (!swal.isVisible()) {
            swal.fire({
              icon: 'warning',
              title: 'Rappel de saisie des données',
              html: `Vous devez saisir les données KPI pour <strong>${agenceName}</strong> du jour <strong>${dd}/${mm}/${yyyy}</strong>.`,
              confirmButtonText: 'Aller à la saisie',
              showCancelButton: true,
              cancelButtonText: 'Fermer',
              timer: null, // Pas de timer automatique
              allowOutsideClick: true,
              allowEscapeKey: true
            }).then((result) => {
              if (result.isConfirmed) {
                // Rediriger vers la page KPI
                navigate('/kpi');
              }
            });
          }
        } else {
          // Si les données existent, fermer l'alerte si elle est ouverte
          if (swal.isVisible()) {
            swal.close();
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des données du jour:', error);
      }
    };

    // Vérifier immédiatement au chargement (après un petit délai pour permettre le chargement)
    const initialTimeout = setTimeout(() => {
      checkTodayData();
    }, 2000);

    // Configurer l'intervalle pour vérifier toutes les 10 minutes (600000 ms)
    alertCheckIntervalRef.current = setInterval(checkTodayData, 10 * 60 * 1000);

    // Nettoyer l'intervalle et le timeout au démontage du composant
    return () => {
      clearInterval(alertCheckIntervalRef.current);
      clearTimeout(initialTimeout);
    };
  }, [navigate]); // Dépend de navigate pour la redirection

  // Ce composant ne rend rien visuellement
  return null;
}

export default DataEntryReminder;

