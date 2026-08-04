/**
 * Middleware centralisé de gestion d'erreurs
 * SÉCURITÉ: Ne jamais exposer les détails techniques (err.message) en production
 */

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Gestionnaire d'erreurs global Express (4 args requis)
 */
function errorHandler(err, req, res, next) {
  // Logger l'erreur complète côté serveur
  const logContext = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
    error: err.message,
    stack: err.stack,
  };
  console.error('❌ Erreur serveur:', logContext);

  // Déterminer le code de statut
  const status = err.status || err.statusCode || 500;

  // Réponse générique en production — ne jamais exposer err.message
  const response = {
    message: friendlyMessage(status),
    code: err.code || 'SERVER_ERROR',
  };

  // En développement uniquement, inclure le message technique pour le debug
  if (isDev) {
    response.debug = err.message;
  }

  res.status(status).json(response);
}

/**
 * Retourne un message utilisateur générique selon le code HTTP
 */
function friendlyMessage(status) {
  switch (status) {
    case 400: return 'Données de la requête invalides.';
    case 401: return 'Authentification requise.';
    case 403: return 'Accès refusé.';
    case 404: return 'Ressource introuvable.';
    case 429: return 'Trop de requêtes. Veuillez réessayer plus tard.';
    default:  return 'Une erreur interne est survenue. Veuillez réessayer.';
  }
}

/**
 * Wrapper pour les routes async — capture les rejets de promesse
 * Usage: router.get('/route', asyncHandler(async (req, res) => { ... }))
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Helper pour renvoyer une erreur 500 générique depuis un catch
 * Usage: dans un catch(err) => safeError(res, err)
 */
function safeError(res, err, friendlyMsg = 'Une erreur interne est survenue.') {
  console.error('❌ Erreur:', err.message, err.stack);
  const isDevelopment = process.env.NODE_ENV !== 'production';
  return res.status(500).json({
    message: friendlyMsg,
    ...(isDevelopment && { debug: err.message }),
  });
}

module.exports = { errorHandler, asyncHandler, safeError };
