import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import kpiService from '../services/kpiService';
import { swal } from '../utils/swal';
import { convertDateToYYYYMMDD } from '../utils/dateUtils';

/**
 * Composant global de rappel de saisie des données KPI
 * Affiche une alerte toutes les 10 minutes à partir de 14:00
 * pour rappeler aux utilisateurs standard de saisir leurs données du jour
 * L'alerte persiste même lors des changements de page
 */
function DataEntryReminder() {
  const alertCheckIntervalRef = useRef(null);
  const initialTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const navigateRef = useRef(navigate);

  // Mettre à jour la référence de navigate à chaque changement
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    // Ne pas activer l'alerte sur la page de login
    if (location.pathname === '/login') {
      // Nettoyer les intervalles si on est sur la page de login
      if (alertCheckIntervalRef.current) {
        clearInterval(alertCheckIntervalRef.current);
        alertCheckIntervalRef.current = null;
      }
      if (initialTimeoutRef.current) {
        clearTimeout(initialTimeoutRef.current);
        initialTimeoutRef.current = null;
      }
      return;
    }

    const user = authService.getCurrentUser();
    const isAdmin = (user?.role || '').toString() === 'Administrateur';
    const userAgenceId = user?.agenceId ? Number(user.agenceId) : null;

    // Ne pas activer l'alerte si l'utilisateur n'est pas authentifié
    if (!authService.isAuthenticated()) {
      // Nettoyer les intervalles si l'utilisateur n'est pas authentifié
      if (alertCheckIntervalRef.current) {
        clearInterval(alertCheckIntervalRef.current);
        alertCheckIntervalRef.current = null;
      }
      if (initialTimeoutRef.current) {
        clearTimeout(initialTimeoutRef.current);
        initialTimeoutRef.current = null;
      }
      return;
    }

    // Ne pas activer l'alerte pour les administrateurs ou si pas d'agence
    if (isAdmin || !userAgenceId) {
      // Nettoyer les intervalles si l'utilisateur est admin ou n'a pas d'agence
      if (alertCheckIntervalRef.current) {
        clearInterval(alertCheckIntervalRef.current);
        alertCheckIntervalRef.current = null;
      }
      if (initialTimeoutRef.current) {
        clearTimeout(initialTimeoutRef.current);
        initialTimeoutRef.current = null;
      }
      return;
    }

    // Si un intervalle existe déjà, ne pas en créer un nouveau
    if (alertCheckIntervalRef.current) {
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
        // Vérifier à nouveau l'authentification à chaque vérification
        if (!authService.isAuthenticated()) {
          return;
        }

        const user = authService.getCurrentUser();
        const currentUserAgenceId = user?.agenceId ? Number(user.agenceId) : null;
        
        if (!currentUserAgenceId) {
          return;
        }

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
        const existingData = await kpiService.getExistingData(todayDateKey, currentUserAgenceId);
        
        // Si aucune donnée n'existe, afficher l'alerte
        if (!existingData || existingData.length === 0) {
          // Charger les agences pour obtenir le nom
          const agences = await loadAgences();
          const agence = agences.find(a => Number(a.AgenceId) === currentUserAgenceId);
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
                // Rediriger vers la page KPI en utilisant la référence
                navigateRef.current('/kpi');
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
    initialTimeoutRef.current = setTimeout(() => {
      checkTodayData();
    }, 2000);

    // Configurer l'intervalle pour vérifier toutes les 10 minutes (600000 ms)
    alertCheckIntervalRef.current = setInterval(checkTodayData, 10 * 60 * 1000);

    // Nettoyer l'intervalle et le timeout au démontage du composant ou changement de route
    return () => {
      // Ne pas nettoyer si on change juste de page, seulement si on se démonte complètement
      // L'intervalle doit persister entre les pages
    };
  }, [location.pathname]); // Seulement réagir aux changements de route pour nettoyer si nécessaire

  // Nettoyer au démontage complet du composant
  useEffect(() => {
    return () => {
      if (alertCheckIntervalRef.current) {
        clearInterval(alertCheckIntervalRef.current);
        alertCheckIntervalRef.current = null;
      }
      if (initialTimeoutRef.current) {
        clearTimeout(initialTimeoutRef.current);
        initialTimeoutRef.current = null;
      }
    };
  }, []);

  // Ce composant ne rend rien visuellement
  return null;
}

export default DataEntryReminder;

