/**
 * Utilitaires de gestion des dates pour éviter les décalages de fuseau horaire
 * Utilisé dans tout le projet pour assurer la cohérence des dates
 */

/**
 * Convertit une date en format YYYYMMDD sans décalage de fuseau horaire
 * @param {string|number|Date} dateInput - Date à convertir
 * @returns {number} Date au format YYYYMMDD (ex: 20251001)
 */
export const convertDateToYYYYMMDD = (dateInput) => {
  console.log('🔍 DEBUG convertDateToYYYYMMDD - Date d\'entrée:', dateInput, typeof dateInput);
  
  // Si c'est déjà au format YYYYMMDD (entier), le retourner
  if (typeof dateInput === 'number') {
    console.log('🔍 DEBUG convertDateToYYYYMMDD - Déjà un nombre:', dateInput);
    return dateInput;
  }
  
  // Si c'est une chaîne au format "YYYY-MM-DD", parser directement
  if (typeof dateInput === 'string' && dateInput.includes('-')) {
    const parts = dateInput.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);
    
    const result = parseInt(
      year.toString() + 
      month.toString().padStart(2, '0') + 
      day.toString().padStart(2, '0')
    );
    
    console.log('🔍 DEBUG convertDateToYYYYMMDD - Conversion directe:', { dateInput, parts, result });
    return result;
  }
  
  // Si c'est un objet Date, utiliser les méthodes locales
  if (dateInput instanceof Date) {
    const year = dateInput.getFullYear();
    const month = dateInput.getMonth() + 1;
    const day = dateInput.getDate();
    
    const result = parseInt(
      year.toString() + 
      month.toString().padStart(2, '0') + 
      day.toString().padStart(2, '0')
    );
    
    console.log('🔍 DEBUG convertDateToYYYYMMDD - Conversion via Date:', { dateInput, year, month, day, result });
    return result;
  }
  
  // Sinon, essayer de créer une date et convertir
  // ⚠️ ATTENTION: new Date() peut causer des décalages de fuseau horaire
  const date = new Date(dateInput);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const result = parseInt(
    year.toString() + 
    month.toString().padStart(2, '0') + 
    day.toString().padStart(2, '0')
  );
  
  console.log('🔍 DEBUG convertDateToYYYYMMDD - Conversion finale (⚠️ peut être incorrecte):', { dateInput, date, year, month, day, result });
  return result;
};

/**
 * Convertit une date en format SQL Server DATE sans décalage de fuseau horaire
 * @param {string|number|Date} dateInput - Date à convertir
 * @returns {Date} Date au format SQL Server (midi local pour éviter les décalages)
 */
export const convertDateToSQLServer = (dateInput) => {
  console.log('🔍 DEBUG convertDateToSQLServer - Date d\'entrée:', dateInput);
  
  let year, month, day;
  
  // Si c'est une chaîne au format "YYYY-MM-DD", parser directement
  if (typeof dateInput === 'string' && dateInput.includes('-')) {
    const parts = dateInput.split('-');
    year = parseInt(parts[0]);
    month = parseInt(parts[1]);
    day = parseInt(parts[2]);
  }
  // Si c'est un nombre YYYYMMDD, parser
  else if (typeof dateInput === 'number') {
    const dateStr = dateInput.toString();
    year = parseInt(dateStr.substring(0, 4));
    month = parseInt(dateStr.substring(4, 6));
    day = parseInt(dateStr.substring(6, 8));
  }
  // Si c'est un objet Date, utiliser les méthodes locales
  else if (dateInput instanceof Date) {
    year = dateInput.getFullYear();
    month = dateInput.getMonth() + 1;
    day = dateInput.getDate();
  }
  // Sinon, essayer de créer une date
  else {
    const date = new Date(dateInput);
    year = date.getFullYear();
    month = date.getMonth() + 1;
    day = date.getDate();
  }
  
  // Créer une date locale à midi pour éviter les décalages de fuseau horaire
  const result = new Date(year, month - 1, day, 12, 0, 0, 0);
  
  console.log('🔍 DEBUG convertDateToSQLServer - Conversion:', { dateInput, year, month, day, result });
  return result;
};

/**
 * Formate une date pour l'affichage utilisateur
 * @param {string|number|Date} dateInput - Date à formater
 * @returns {string} Date formatée (ex: "01/10/2025")
 */
export const formatDateForDisplay = (dateInput) => {
  if (!dateInput) return '';
  
  let year, month, day;
  
  if (typeof dateInput === 'string' && dateInput.includes('-')) {
    const parts = dateInput.split('-');
    year = parseInt(parts[0]);
    month = parseInt(parts[1]);
    day = parseInt(parts[2]);
  } else if (typeof dateInput === 'number') {
    const dateStr = dateInput.toString();
    year = parseInt(dateStr.substring(0, 4));
    month = parseInt(dateStr.substring(4, 6));
    day = parseInt(dateStr.substring(6, 8));
  } else if (dateInput instanceof Date) {
    year = dateInput.getFullYear();
    month = dateInput.getMonth() + 1;
    day = dateInput.getDate();
  } else {
    const date = new Date(dateInput);
    year = date.getFullYear();
    month = date.getMonth() + 1;
    day = date.getDate();
  }
  
  return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
};

/**
 * Valide qu'une date est au format YYYYMMDD
 * @param {number} dateKey - Date à valider
 * @returns {boolean} True si la date est valide
 */
export const isValidDateKey = (dateKey) => {
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
