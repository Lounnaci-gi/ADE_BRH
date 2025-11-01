/**
 * Middleware de sécurité pour protéger contre les attaques SQL injection
 * et valider/sanitizer les entrées utilisateur
 */

// Patterns SQL injection communs à détecter
const SQL_INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/i,
    /(--|#|\/\*|\*\/|;)/,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\b(OR|AND)\s+['"](.*)['"]\s*=\s*['"](.*)['"])/i,
    /(\b(OR|AND)\s+\d+\s*LIKE)/i,
    /(CHAR|ASCII|SUBSTRING|CAST|CONVERT)\s*\(/i,
    /(\bXP_|\bSP_|\bCMDSHELL)/i,
    /(WAITFOR\s+DELAY|BENCHMARK|SLEEP)/i,
    /(<script|javascript:|onerror=|onload=)/i, // XSS aussi
];

/**
 * Détecte les tentatives d'injection SQL dans une chaîne
 */
function detectSQLInjection(input) {
    if (!input || typeof input !== 'string') return false;
    
    // Vérifier chaque pattern
    for (const pattern of SQL_INJECTION_PATTERNS) {
        if (pattern.test(input)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Sanitize une chaîne de caractères pour prévenir les injections
 */
function sanitizeInput(input, maxLength = null) {
    if (input === null || input === undefined) return null;
    
    // Convertir en string si ce n'est pas déjà le cas
    let sanitized = String(input);
    
    // Retirer les caractères de contrôle et les espaces en début/fin
    sanitized = sanitized.trim();
    
    // Limiter la longueur si spécifié
    if (maxLength && sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }
    
    // Échapper les caractères dangereux (optionnel, car on utilise des requêtes paramétrées)
    // Mais cela ajoute une couche supplémentaire de sécurité
    
    return sanitized;
}

/**
 * Valide un nom d'utilisateur
 */
function validateUsername(username) {
    if (!username || typeof username !== 'string') {
        return { valid: false, error: 'Le nom d\'utilisateur est requis' };
    }
    
    const sanitized = sanitizeInput(username, 50);
    
    if (sanitized.length < 3) {
        return { valid: false, error: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' };
    }
    
    if (sanitized.length > 50) {
        return { valid: false, error: 'Le nom d\'utilisateur ne peut pas dépasser 50 caractères' };
    }
    
    // Autoriser seulement les caractères alphanumériques, underscore, tiret et point
    if (!/^[a-zA-Z0-9._-]+$/.test(sanitized)) {
        return { valid: false, error: 'Le nom d\'utilisateur contient des caractères non autorisés' };
    }
    
    if (detectSQLInjection(sanitized)) {
        return { valid: false, error: 'Nom d\'utilisateur invalide - tentative d\'injection détectée' };
    }
    
    return { valid: true, sanitized };
}

/**
 * Valide un mot de passe
 */
function validatePassword(password) {
    if (!password || typeof password !== 'string') {
        return { valid: false, error: 'Le mot de passe est requis' };
    }
    
    const sanitized = sanitizeInput(password, 128);
    
    if (sanitized.length < 6) {
        return { valid: false, error: 'Le mot de passe doit contenir au moins 6 caractères' };
    }
    
    if (sanitized.length > 128) {
        return { valid: false, error: 'Le mot de passe ne peut pas dépasser 128 caractères' };
    }
    
    if (detectSQLInjection(sanitized)) {
        return { valid: false, error: 'Mot de passe invalide - tentative d\'injection détectée' };
    }
    
    return { valid: true, sanitized };
}

/**
 * Middleware Express pour détecter les tentatives d'injection SQL
 */
function sqlInjectionDetection(req, res, next) {
    // Vérifier les paramètres de requête
    if (req.query) {
        for (const [key, value] of Object.entries(req.query)) {
            if (typeof value === 'string' && detectSQLInjection(value)) {
                console.warn(`⚠️  Tentative d'injection SQL détectée - Query param: ${key}`, {
                    ip: req.ip,
                    userAgent: req.get('user-agent'),
                    value: value.substring(0, 100) // Limiter le logging
                });
                return res.status(400).json({ 
                    error: 'Requête invalide détectée',
                    code: 'INVALID_REQUEST'
                });
            }
        }
    }
    
    // Vérifier le corps de la requête
    if (req.body && typeof req.body === 'object') {
        for (const [key, value] of Object.entries(req.body)) {
            if (typeof value === 'string' && detectSQLInjection(value)) {
                console.warn(`⚠️  Tentative d'injection SQL détectée - Body param: ${key}`, {
                    ip: req.ip,
                    userAgent: req.get('user-agent'),
                    value: value.substring(0, 100)
                });
                return res.status(400).json({ 
                    error: 'Requête invalide détectée',
                    code: 'INVALID_REQUEST'
                });
            }
        }
    }
    
    // Vérifier les paramètres d'URL
    if (req.params) {
        for (const [key, value] of Object.entries(req.params)) {
            if (typeof value === 'string' && detectSQLInjection(value)) {
                console.warn(`⚠️  Tentative d'injection SQL détectée - URL param: ${key}`, {
                    ip: req.ip,
                    userAgent: req.get('user-agent'),
                    value: value.substring(0, 100)
                });
                return res.status(400).json({ 
                    error: 'Requête invalide détectée',
                    code: 'INVALID_REQUEST'
                });
            }
        }
    }
    
    next();
}

module.exports = {
    detectSQLInjection,
    sanitizeInput,
    validateUsername,
    validatePassword,
    sqlInjectionDetection
};

