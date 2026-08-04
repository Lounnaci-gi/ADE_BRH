const bcrypt = require('bcryptjs');
const { validateUsername, validatePassword } = require('../middleware/security');
const db = require('../utils/db');
const { TYPES } = db;

// Basic in-memory rate limiter for login attempts per user+IP
const loginAttempts = new Map();
const MAX_ATTEMPTS = 3; // after 3 failed attempts
const BLOCK_WINDOW_MS = 15 * 60 * 1000; // block for 15 minutes

function getClientIp(req) {
    const fwd = req.headers['x-forwarded-for'];
    const real = req.headers['x-real-ip'];
    let ip = (Array.isArray(fwd) ? fwd[0] : (fwd || '')).split(',')[0].trim()
      || (typeof real === 'string' ? real.trim() : '')
      || (req.ip || '')
      || (req.connection?.remoteAddress || '')
      || (req.socket?.remoteAddress || '')
      || 'unknown';
    // Normalize IPv6/IPv4-mapped addresses
    if (ip.startsWith('::ffff:')) ip = ip.substring(7);
    if (ip === '::1') ip = '127.0.0.1';
    return ip;
}

function getAttemptKey(username, ip) {
    // Lock by client IP to block access regardless of username during window
    return `${ip || 'unknown'}`;
}

function getAttempts(username, ip) {
    const key = getAttemptKey(username, ip);
    const entry = loginAttempts.get(key) || { count: 0, until: 0 };
    return { key, entry };
}

function recordFailure(username, ip) {
    const { key, entry } = getAttempts(username, ip);
    const now = Date.now();
    // Conserver le compteur existant (ne jamais le remettre à 0 hors blocage)
    let count = typeof entry.count === 'number' ? entry.count : 0;
    count += 1;
    if (count >= MAX_ATTEMPTS) {
        loginAttempts.set(key, { count: MAX_ATTEMPTS, until: now + BLOCK_WINDOW_MS });
        return { blocked: true, remainingMs: BLOCK_WINDOW_MS };
    }
    loginAttempts.set(key, { count, until: 0 });
    return { blocked: false, remaining: MAX_ATTEMPTS - count };
}

function clearAttempts(username, ip) {
    const key = getAttemptKey(username, ip);
    const entry = loginAttempts.get(key);
    const now = Date.now();
    // Do not clear if currently blocked
    if (entry && entry.until && now < entry.until) return;
    loginAttempts.delete(key);
}

// Route de login
const login = async (req, res) => {
    const { username: usernameRaw, password: passwordRaw } = req.body;
    const clientIp = getClientIp(req);

    const usernameValidation = validateUsername(usernameRaw);
    if (!usernameValidation.valid) {
        return res.status(400).json({ error: usernameValidation.error });
    }
    const username = usernameValidation.sanitized;

    const passwordValidation = validatePassword(passwordRaw);
    if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.error });
    }
    const password = passwordValidation.sanitized;

    const { entry } = getAttempts(username, clientIp);
    const now = Date.now();
    if (entry.until && now < entry.until) {
        const retryAfterSec = Math.ceil((entry.until - now) / 1000);
        res.setHeader('Retry-After', retryAfterSec);
        return res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.', retryAfterSec });
    }

    try {
        const users = await db.query(`
            SELECT 
                UtilisateurId,
                Nom_Utilisateur,
                Mot_de_Passe_Hash,
                FK_Agence,
                [Role],
                Email,
                IsActive
            FROM dbo.DIM_UTILISATEUR
            WHERE Nom_Utilisateur = @username AND IsActive = 1
        `, [{ name: 'username', type: TYPES.NVarChar, value: username }]);

        if (users.length === 0) {
            const result = recordFailure(username, clientIp);
            if (result.blocked) {
                return res.status(429).json({ error: 'Compte temporairement bloqué suite aux tentatives.', retryAfterSec: Math.ceil(BLOCK_WINDOW_MS / 1000) });
            }
            return res.status(401).json({
                error: 'Utilisateur non trouvé ou inactif',
                remainingAttempts: Math.max(0, MAX_ATTEMPTS - (loginAttempts.get(getAttemptKey(username, clientIp))?.count || 0))
            });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.Mot_de_Passe_Hash.toString());

        if (isMatch) {
            clearAttempts(username, clientIp);
            return res.json({
                success: true,
                message: 'Connexion réussie',
                user: {
                    id: user.UtilisateurId,
                    username: user.Nom_Utilisateur,
                    role: user.Role,
                    agenceId: user.FK_Agence,
                    email: user.Email
                }
            });
        }

        const result = recordFailure(username, clientIp);
        if (result.blocked) {
            return res.status(429).json({ error: 'Compte temporairement bloqué suite aux tentatives.', retryAfterSec: Math.ceil(BLOCK_WINDOW_MS / 1000) });
        }
        return res.status(401).json({
            error: 'Mot de passe incorrect',
            remainingAttempts: Math.max(0, MAX_ATTEMPTS - (loginAttempts.get(getAttemptKey(username, clientIp))?.count || 0))
        });
    } catch (err) {
        console.error('Erreur DB login:', err);
        return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
    }
};

const updateAdminPassword = async (req, res) => {
    const { password } = req.body;
    if (!password || typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ error: 'Mot de passe requis (minimum 8 caractères)' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        const result = await db.execute(`
            UPDATE dbo.DIM_UTILISATEUR
            SET Mot_de_Passe_Hash = @hash
            WHERE Nom_Utilisateur = 'admin'
        `, [{ name: 'hash', type: TYPES.VarBinary, value: Buffer.from(hash) }]);

        return res.json({
            success: true,
            message: 'Mot de passe admin mis à jour',
            rowsAffected: result.rowsAffected?.[0] || 0
        });
    } catch (err) {
        console.error('Erreur updateAdminPassword:', err);
        return res.status(500).json({ error: 'Erreur lors de la mise à jour du mot de passe' });
    }
};

const createAdmin = async (req, res) => {
    const username = req.body?.username || 'admin';
    const password = req.body?.password;
    const email = req.body?.email || 'admin@ade.dz';

    if (!password || typeof password !== 'string') {
        return res.status(400).json({
            error: 'Mot de passe requis pour créer l\'administrateur',
            message: 'Fournissez un mot de passe sécurisé dans le body de la requête'
        });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        const result = await db.query(`
            IF NOT EXISTS (SELECT 1 FROM dbo.DIM_UTILISATEUR WHERE Nom_Utilisateur = 'admin')
            BEGIN
                INSERT INTO dbo.DIM_UTILISATEUR 
                    (Nom_Utilisateur, Mot_de_Passe_Hash, FK_Agence, [Role], Email, IsActive)
                VALUES 
                    (@username, @hash, NULL, 'Administrateur', @email, 1)
            END
            ELSE
            BEGIN
                UPDATE dbo.DIM_UTILISATEUR
                SET Mot_de_Passe_Hash = @hash,
                    Email = @email,
                    IsActive = 1
                WHERE Nom_Utilisateur = @username
            END
            
            SELECT @@ROWCOUNT as RowsAffected
        `, [
            { name: 'username', type: TYPES.NVarChar, value: username },
            { name: 'hash', type: TYPES.VarBinary, value: Buffer.from(hash) },
            { name: 'email', type: TYPES.NVarChar, value: email }
        ]);

        return res.json({
            success: true,
            message: 'Utilisateur admin créé/mis à jour avec succès',
            username,
            result
        });
    } catch (err) {
        console.error('Erreur DB createAdmin:', err);
        return res.status(500).json({ error: 'Erreur lors de la création du compte administrateur' });
    }
};

module.exports = { login, updateAdminPassword, createAdmin };
