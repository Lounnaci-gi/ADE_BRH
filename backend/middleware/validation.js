/**
 * Middleware de validation pour les paramètres d'entrée
 */

/**
 * Valide un ID depuis les paramètres d'URL
 * @param {string} idParam - Le nom du paramètre (ex: 'id', 'userId')
 * @returns {function} Middleware Express
 */
function validateId(idParam = 'id') {
    return (req, res, next) => {
        const id = req.params[idParam];
        
        if (!id) {
            return res.status(400).json({ 
                message: `Paramètre ${idParam} manquant`,
                error: 'PARAMETER_MISSING'
            });
        }
        
        // SÉCURITÉ: Vérifier que l'ID est un nombre entier positif
        const idNum = parseInt(id, 10);
        if (isNaN(idNum) || idNum <= 0 || !Number.isInteger(idNum)) {
            return res.status(400).json({ 
                message: `Paramètre ${idParam} invalide. Doit être un nombre entier positif.`,
                error: 'INVALID_ID'
            });
        }
        
        // Ajouter l'ID validé dans req.params pour éviter de le revalider
        req.params[`${idParam}_validated`] = idNum;
        next();
    };
}

/**
 * Sanitize et valide une chaîne de caractères
 */
function sanitizeString(str, maxLength = null, allowEmpty = false) {
    if (str === null || str === undefined) {
        return allowEmpty ? '' : null;
    }
    
    let sanitized = String(str).trim();
    
    if (!allowEmpty && sanitized.length === 0) {
        return null;
    }
    
    if (maxLength && sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
}

/**
 * Valide un email
 */
function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Middleware pour valider que les paramètres requis sont présents
 */
function requireParams(...paramNames) {
    return (req, res, next) => {
        const missing = [];
        
        for (const param of paramNames) {
            if (req.body[param] === undefined || req.body[param] === null || req.body[param] === '') {
                missing.push(param);
            }
        }
        
        if (missing.length > 0) {
            return res.status(400).json({
                message: `Paramètres manquants: ${missing.join(', ')}`,
                error: 'MISSING_PARAMETERS',
                missing
            });
        }
        
        next();
    };
}

module.exports = {
    validateId,
    sanitizeString,
    validateEmail,
    requireParams
};

