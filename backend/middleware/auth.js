/**
 * Middleware d'authentification basique
 * SÉCURITÉ: Vérifie que les headers d'authentification sont présents
 * NOTE: Ceci est une solution temporaire. Pour une sécurité complète, implémenter JWT.
 */

/**
 * Middleware pour vérifier que l'utilisateur est authentifié
 * (vérifie la présence des headers d'authentification)
 */
function requireAuth(req, res, next) {
    const role = (req.headers['x-role'] || '').toString().trim();
    const userId = req.headers['x-user-id'];
    
    // SÉCURITÉ: Rejeter les requêtes sans authentification
    if (!role || (role !== 'Administrateur' && role !== 'Standard')) {
        return res.status(401).json({ 
            message: 'Authentification requise',
            error: 'Headers d\'authentification manquants ou invalides'
        });
    }
    
    // SÉCURITÉ: Vérifier que userId est présent pour les utilisateurs Standard
    if (role === 'Standard' && (!userId || !userId.toString().trim())) {
        return res.status(401).json({ 
            message: 'Authentification invalide',
            error: 'ID utilisateur requis pour les utilisateurs Standard'
        });
    }
    
    next();
}

/**
 * Middleware pour vérifier que l'utilisateur est administrateur
 */
function requireAdmin(req, res, next) {
    const role = (req.headers['x-role'] || '').toString().trim();
    
    if (role !== 'Administrateur') {
        return res.status(403).json({ 
            message: 'Accès refusé',
            error: 'Privilèges administrateur requis'
        });
    }
    
    next();
}

/**
 * Middleware pour vérifier que l'utilisateur est au moins connecté (admin ou standard)
 */
function requireRole(roles = ['Administrateur', 'Standard']) {
    return (req, res, next) => {
        const role = (req.headers['x-role'] || '').toString().trim();
        
        if (!roles.includes(role)) {
            return res.status(403).json({ 
                message: 'Accès refusé',
                error: `Rôle requis: ${roles.join(' ou ')}`
            });
        }
        
        next();
    };
}

module.exports = {
    requireAuth,
    requireAdmin,
    requireRole
};

