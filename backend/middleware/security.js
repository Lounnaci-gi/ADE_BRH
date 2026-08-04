/**
 * Middleware de sécurité — Protection contre les injections SQL et les failles XSS
 * Couche de défense en profondeur (les requêtes paramétrées restent la protection principale)
 */

// ─── Patterns SQL Injection ────────────────────────────────────────────────────
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE|UNION|MERGE|REPLACE)\b)/i,
  /(--|#|\/\*|\*\/|;)/,
  /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
  /(\b(OR|AND)\s+['"](.*)['"]\s*=\s*['"](.*)['"'])/i,
  /(\b(OR|AND)\s+\d+\s*LIKE)/i,
  /(CHAR|ASCII|SUBSTRING|SUBSTR|CAST|CONVERT|CONCAT|GROUP_CONCAT)\s*\(/i,
  /(\bXP_|\bSP_|\bCMDSHELL|\bOPENROWSET|\bOPENDATASOURCE)/i,
  /(WAITFOR\s+DELAY|BENCHMARK|SLEEP|PG_SLEEP)/i,
  /(INFORMATION_SCHEMA|SYS\.TABLES|SYS\.COLUMNS|SYSOBJECTS)/i,
  /(1\s*=\s*1|0\s*=\s*0)/,                      // tautologie classique
  /(\bHAVING\s+\d|\bGROUP\s+BY\s+\d)/i,
];

// ─── Patterns XSS ──────────────────────────────────────────────────────────────
const XSS_PATTERNS = [
  /<\s*script[\s\S]*?>[\s\S]*?<\s*\/\s*script\s*>/i,
  /<\s*script[\s>]/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /data\s*:\s*text\s*\/\s*html/i,
  /data\s*:\s*image\/svg/i,
  /on\w+\s*=/i,                                  // onerror=, onload=, onmouseover=, onfocus=, etc.
  /<\s*iframe[\s\S]*?>/i,
  /<\s*object[\s\S]*?>/i,
  /<\s*embed[\s\S]*?>/i,
  /<\s*link[\s\S]*?>/i,
  /<\s*meta[\s\S]*?>/i,
  /expression\s*\(/i,                            // CSS expression()
  /url\s*\(\s*['"]?\s*javascript/i,
];

// ─── Détection ────────────────────────────────────────────────────────────────

function detectSQLInjection(input) {
  if (!input || typeof input !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some((p) => p.test(input));
}

function detectXSS(input) {
  if (!input || typeof input !== 'string') return false;
  return XSS_PATTERNS.some((p) => p.test(input));
}

function detectThreat(input) {
  return detectSQLInjection(input) || detectXSS(input);
}

// ─── Sanitisation ─────────────────────────────────────────────────────────────

/**
 * Sanitise une chaîne générique (trim + limite longueur)
 */
function sanitizeInput(input, maxLength = null) {
  if (input === null || input === undefined) return null;
  let sanitized = String(input).trim();
  // Supprimer les caractères de contrôle (sauf newline/tab légitimes)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
}

/**
 * Sanitise un champ texte libre destiné à être stocké en base.
 * Supprime les balises HTML/JS potentiellement dangereuses.
 * Utilisé pour : Nom_Agence, Adresse, Observation, Libelle, etc.
 */
function sanitizeTextField(input, maxLength = 500) {
  if (input === null || input === undefined) return null;
  let sanitized = String(input).trim();

  // Supprimer les balises HTML complètes
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Supprimer les attributs d'événements résiduels
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  sanitized = sanitized.replace(/vbscript\s*:/gi, '');

  // Supprimer les caractères de contrôle
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Échappe les caractères HTML spéciaux pour une sortie sécurisée
 * (défense en profondeur côté API, React gère déjà cela côté rendu)
 */
function escapeHtml(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ─── Validation métier ────────────────────────────────────────────────────────

function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: "Le nom d'utilisateur est requis" };
  }
  const sanitized = sanitizeInput(username, 50);
  if (!sanitized || sanitized.length < 3) {
    return { valid: false, error: "Le nom d'utilisateur doit contenir au moins 3 caractères" };
  }
  if (sanitized.length > 50) {
    return { valid: false, error: "Le nom d'utilisateur ne peut pas dépasser 50 caractères" };
  }
  // Autoriser seulement les caractères alphanumériques, underscore, tiret, point
  if (!/^[a-zA-Z0-9._-]+$/.test(sanitized)) {
    return { valid: false, error: "Le nom d'utilisateur contient des caractères non autorisés" };
  }
  if (detectThreat(sanitized)) {
    return { valid: false, error: "Nom d'utilisateur invalide" };
  }
  return { valid: true, sanitized };
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Le mot de passe est requis' };
  }
  const sanitized = sanitizeInput(password, 128);
  if (!sanitized || sanitized.length < 6) {
    return { valid: false, error: 'Le mot de passe doit contenir au moins 6 caractères' };
  }
  if (sanitized.length > 128) {
    return { valid: false, error: 'Le mot de passe ne peut pas dépasser 128 caractères' };
  }
  return { valid: true, sanitized };
}

// ─── Middleware Express ───────────────────────────────────────────────────────

/**
 * Vérifie récursivement un objet/tableau à la recherche de menaces
 */
function scanObject(obj, depth = 0) {
  if (depth > 5) return false; // éviter la récursion infinie
  if (typeof obj === 'string') return detectThreat(obj);
  if (Array.isArray(obj)) return obj.some((v) => scanObject(v, depth + 1));
  if (obj && typeof obj === 'object') {
    return Object.values(obj).some((v) => scanObject(v, depth + 1));
  }
  return false;
}

function sqlInjectionDetection(req, res, next) {
  const sources = [
    { location: 'query', data: req.query },
    { location: 'params', data: req.params },
    { location: 'body',   data: req.body },
  ];

  for (const { location, data } of sources) {
    if (data && scanObject(data)) {
      console.warn(`⚠️  Menace détectée [${location}]`, {
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString(),
      });
      return res.status(400).json({
        message: 'Requête rejetée — données non conformes.',
        code: 'INVALID_REQUEST',
      });
    }
  }

  next();
}

module.exports = {
  detectSQLInjection,
  detectXSS,
  detectThreat,
  sanitizeInput,
  sanitizeTextField,
  escapeHtml,
  validateUsername,
  validatePassword,
  sqlInjectionDetection,
};
