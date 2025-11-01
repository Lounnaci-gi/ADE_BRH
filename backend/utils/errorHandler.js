/**
 * Utilitaire pour gérer les erreurs de manière sécurisée
 * Ne pas exposer les détails techniques aux clients
 */

/**
 * Formate une réponse d'erreur sécurisée
 * @param {Error} err - L'erreur à formater
 * @param {string} defaultMessage - Message par défaut à retourner
 * @param {boolean} logDetails - Si true, logger les détails complets (toujours false en production)
 */
function formatErrorResponse(err, defaultMessage = 'Une erreur est survenue', logDetails = true) {
    // Logger les détails complets côté serveur
    if (logDetails) {
        console.error('Erreur détectée:', {
            message: err?.message,
            stack: err?.stack,
            name: err?.name,
            number: err?.number // Pour les erreurs SQL Server
        });
    }
    
    // Déterminer le message et le code de statut
    let message = defaultMessage;
    let statusCode = 500;
    
    // Détecter les types d'erreurs spécifiques (sans exposer les détails)
    if (err?.number === 547) {
        // Erreur SQL Server: Contrainte de clé étrangère
        message = 'Impossible de procéder: des données sont liées à cet élément.';
        statusCode = 409;
    } else if (err?.number === 2627 || err?.number === 2601) {
        // Erreur SQL Server: Violation de contrainte unique
        message = 'Cette donnée existe déjà.';
        statusCode = 409;
    } else if (err?.message && err.message.includes('constraint')) {
        message = 'Violation de contrainte de base de données.';
        statusCode = 400;
    } else if (err?.message && err.message.includes('foreign key')) {
        message = 'Référence invalide.';
        statusCode = 400;
    } else if (err?.message && err.message.includes('conversion')) {
        message = 'Erreur de conversion de données.';
        statusCode = 400;
    }
    
    return {
        message,
        statusCode,
        // SÉCURITÉ: Ne jamais exposer err.message ou err.stack en production
        // Exposer uniquement en développement si nécessaire
        ...(process.env.NODE_ENV === 'development' && {
            error: err?.message,
            details: process.env.DEBUG ? err?.stack : undefined
        })
    };
}

/**
 * Middleware Express pour gérer les erreurs de manière sécurisée
 */
function errorHandler(err, req, res, next) {
    const { message, statusCode } = formatErrorResponse(err, 'Une erreur est survenue');
    res.status(statusCode).json({ message });
}

module.exports = {
    formatErrorResponse,
    errorHandler
};

