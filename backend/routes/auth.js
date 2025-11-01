const { Connection, Request, TYPES } = require('tedious');
const bcrypt = require('bcryptjs');
const { validateUsername, validatePassword } = require('../middleware/security');

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

// Configuration de connexion (à importer depuis server.js ou .env)
const getConfig = () => ({
    server: process.env.DB_SERVER || 'localhost',
    authentication: {
        type: 'default',
        options: {
            userName: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        }
    },
    options: {
        database: process.env.DB_DATABASE,
        trustServerCertificate: true,
        encrypt: false,
        instanceName: 'SQLEXPRESS',
        enableArithAbort: true
    }
});

// Route de login
const login = (req, res) => {
    const { username: usernameRaw, password: passwordRaw } = req.body;
    const clientIp = getClientIp(req);

    // Validation et sanitization des entrées
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

    // Check lockout state before hitting DB
    const { entry } = getAttempts(username, clientIp);
    const now = Date.now();
    if (entry.until && now < entry.until) {
        const retryAfterSec = Math.ceil((entry.until - now) / 1000);
        res.setHeader('Retry-After', retryAfterSec);
        return res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.', retryAfterSec });
    }

    const connection = new Connection(getConfig());

    connection.on('connect', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
        }

        let users = [];

        const query = `
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
        `;

        const request = new Request(query, (err, rowCount) => {
            if (err) {
                connection.close();
                return res.status(500).json({ error: err.message });
            }

            if (users.length === 0) {
                connection.close();
                const result = recordFailure(username, clientIp);
                if (result.blocked) {
                    return res.status(429).json({ error: 'Compte temporairement bloqué suite aux tentatives.', retryAfterSec: Math.ceil(BLOCK_WINDOW_MS / 1000) });
                }
                return res.status(401).json({ error: 'Utilisateur non trouvé ou inactif', remainingAttempts: Math.max(0, MAX_ATTEMPTS - (loginAttempts.get(getAttemptKey(username, clientIp))?.count || 0)) });
            }

            const user = users[0];

            // Comparer le mot de passe
            bcrypt.compare(password, user.Mot_de_Passe_Hash.toString(), (err, isMatch) => {
                connection.close();

                if (err) {
                    return res.status(500).json({ error: 'Erreur lors de la vérification du mot de passe' });
                }

                if (isMatch) {
                    // Connexion réussie => reset attempts
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
                } else {
                    const result = recordFailure(username, clientIp);
                    if (result.blocked) {
                        return res.status(429).json({ error: 'Compte temporairement bloqué suite aux tentatives.', retryAfterSec: Math.ceil(BLOCK_WINDOW_MS / 1000) });
                    }
                    return res.status(401).json({ error: 'Mot de passe incorrect', remainingAttempts: Math.max(0, MAX_ATTEMPTS - (loginAttempts.get(getAttemptKey(username, clientIp))?.count || 0)) });
                }
            });
        });

        request.addParameter('username', TYPES.NVarChar, username);

        request.on('row', (columns) => {
            let row = {};
            columns.forEach(column => {
                row[column.metadata.colName] = column.value;
            });
            users.push(row);
        });

        connection.execSql(request);
    });

    connection.connect();
};

// Fonction pour créer/mettre à jour le hash du mot de passe admin
const updateAdminPassword = (req, res) => {
    const password = 'admin123'; // Mot de passe à hasher

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors du hashage' });
        }

        const connection = new Connection(getConfig());

        connection.on('connect', (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur de connexion' });
            }

            const query = `
                UPDATE dbo.DIM_UTILISATEUR
                SET Mot_de_Passe_Hash = @hash
                WHERE Nom_Utilisateur = 'admin'
            `;

            const request = new Request(query, (err, rowCount) => {
                connection.close();

                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                return res.json({
                    success: true,
                    message: 'Mot de passe admin mis à jour',
                    rowsAffected: rowCount
                });
            });

            request.addParameter('hash', TYPES.VarBinary, Buffer.from(hash));

            connection.execSql(request);
        });

        connection.connect();
    });
};


// Fonction pour créer l'utilisateur admin initial
const createAdmin = (req, res) => {
    const username = 'admin';
    const password = 'admin123';
    const email = 'admin@ade.dz';

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors du hashage' });
        }

        const connection = new Connection(getConfig());

        connection.on('connect', (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur de connexion' });
            }

            const query = `
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
            `;

            let result = [];

            const request = new Request(query, (err, rowCount) => {
                connection.close();

                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                return res.json({
                    success: true,
                    message: 'Utilisateur admin créé/mis à jour avec succès',
                    username: username,
                    password: password,
                    result: result
                });
            });

            request.addParameter('username', TYPES.NVarChar, username);
            request.addParameter('hash', TYPES.VarBinary, Buffer.from(hash));
            request.addParameter('email', TYPES.NVarChar, email);

            request.on('row', (columns) => {
                let row = {};
                columns.forEach(column => {
                    row[column.metadata.colName] = column.value;
                });
                result.push(row);
            });

            connection.execSql(request);
        });

        connection.connect();
    });
};

module.exports = { login, updateAdminPassword, createAdmin };

