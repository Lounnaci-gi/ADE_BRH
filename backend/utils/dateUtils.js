/**
 * Utilitaires de gestion des dates pour éviter les décalages de fuseau horaire
 * Utilisé dans tout le backend pour assurer la cohérence des dates
 */

/**
 * Convertit une dateKey (YYYYMMDD) en format SQL Server DATE sans décalage de fuseau horaire
 * @param {number} dateKey - Date au format YYYYMMDD
 * @returns {Date} Date JavaScript correctement formatée
 */
const convertDateKeyToSQLServer = (dateKey) => {
  console.log('🔍 DEBUG convertDateKeyToSQLServer - DateKey d\'entrée:', dateKey);
  
  if (typeof dateKey !== 'number') {
    throw new Error('dateKey doit être un nombre au format YYYYMMDD');
  }
  
  const dateStr = dateKey.toString();
  if (dateStr.length !== 8) {
    throw new Error('dateKey doit être au format YYYYMMDD (8 chiffres)');
  }
  
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6));
  const day = parseInt(dateStr.substring(6, 8));
  
  // ✅ CRÉER UNE DATE UTC À MINUIT POUR ÉVITER LES DÉCALAGES
  // Utiliser Date.UTC() pour créer une date UTC pure qui ne subira pas de décalage
  const result = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  
  console.log('🔍 DEBUG convertDateKeyToSQLServer - Conversion UTC:', { 
    dateKey, 
    year, 
    month, 
    day, 
    result,
    resultISO: result.toISOString(),
    resultLocal: result.toLocaleDateString('fr-FR')
  });
  return result;
};

/**
 * Valide qu'une dateKey est au format YYYYMMDD valide
 * @param {number} dateKey - Date à valider
 * @returns {boolean} True si la date est valide
 */
const isValidDateKey = (dateKey) => {
  if (typeof dateKey !== 'number') return false;
  
  const dateStr = dateKey.toString();
  if (dateStr.length !== 8) return false;
  
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6));
  const day = parseInt(dateStr.substring(6, 8));
  
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  // Vérification basique de la validité de la date
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day;
};

/**
 * Formate une dateKey pour l'affichage
 * @param {number} dateKey - Date au format YYYYMMDD
 * @returns {string} Date formatée (ex: "01/10/2025")
 */
const formatDateKeyForDisplay = (dateKey) => {
  if (typeof dateKey !== 'number') return '';
  
  const dateStr = dateKey.toString();
  if (dateStr.length !== 8) return '';
  
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  
  return `${day}/${month}/${year}`;
};

/**
 * Arrondit un montant à 2 décimales maximum
 * @param {number|string} amount - Montant à arrondir
 * @returns {number} Montant arrondi à 2 décimales
 */
const roundAmount = (amount) => {
  if (amount === null || amount === undefined || amount === '') return 0;
  
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return 0;
  
  // Arrondir à 2 décimales maximum
  return Math.round(numAmount * 100) / 100;
};

module.exports = {
  convertDateKeyToSQLServer,
  isValidDateKey,
  formatDateKeyForDisplay,
  roundAmount
};
