const express = require('express');
const { Connection, Request } = require('tedious');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { login, updateAdminPassword, createAdmin } = require('./routes/auth');
const agenceRoutes = require('./routes/agence.js');
const userRoutes = require('./routes/users.js');
const notificationsRoutes = require('./routes/notifications.js');
const meRoutes = require('./routes/me.js');
const categoriesRoutes = require('./routes/categories.js');
const kpiRoutes = require('./routes/kpi.js');
const objectivesRoutes = require('./routes/objectives.js');
const centresRoutes = require('./routes/centres.js');
const communesRoutes = require('./routes/communes.js');
const { sqlInjectionDetection } = require('./middleware/security');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = 5000;

// SÉCURITÉ: Headers de sécurité HTTP avec Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc:      ["'self'"],
            scriptSrc:       ["'self'"],
            styleSrc:        ["'self'", "'unsafe-inline'"],  // React inline styles
            imgSrc:          ["'self'", "data:", "https:"],
            connectSrc:      ["'self'"],
            fontSrc:         ["'self'", "https://fonts.gstatic.com"],
            objectSrc:       ["'none'"],                    // bloquer Flash/plugins
            frameAncestors:  ["'none'"],                    // anti-clickjacking
            formAction:      ["'self'"],                    // anti-CSRF form hijack
            baseUri:         ["'self'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    // Headers supplémentaires anti-XSS
    xContentTypeOptions: true,    // X-Content-Type-Options: nosniff
    xDnsPrefetchControl: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// SÉCURITÉ: Rate limiting global pour prévenir les attaques DoS
// En développement, limite plus élevée pour permettre le développement
const isDevelopment = process.env.NODE_ENV !== 'production';
const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 1000 : 100, // 1000 requêtes en dev, 100 en production
    message: {
        error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Retourner les infos de rate limit dans les headers `RateLimit-*`
    legacyHeaders: false, // Désactiver les headers `X-RateLimit-*`
});

// SÉCURITÉ: Rate limiting plus strict pour les routes d'authentification
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limiter à 5 tentatives de connexion par IP toutes les 15 minutes
    message: {
        error: 'Trop de tentatives de connexion, veuillez réessayer plus tard.',
        retryAfter: '15 minutes'
    },
    skipSuccessfulRequests: true, // Ne pas compter les requêtes réussies
});

// Ensure correct client IP detection behind proxies (doit être avant rate limiting)
app.set('trust proxy', true);

// Middleware CORS - DOIT être avant le rate limiting pour gérer les requêtes OPTIONS
const configuredAllowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const isAllowedOrigin = (origin) => {
    if (!origin) return true;
    if (configuredAllowedOrigins.includes(origin)) return true;
    return /^http:\/\/localhost:\d+$/.test(origin);
};

app.use(cors({
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Role', 'X-User-Agence', 'X-User-Id'],
    credentials: false,
    optionsSuccessStatus: 200
}));

// Rate limiting global pour prévenir les attaques DoS
// Skip les requêtes OPTIONS (preflight CORS) car elles ne doivent pas compter dans la limite
const rateLimitedMiddleware = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next(); // Skip rate limiting for preflight requests
    }
    return globalRateLimiter(req, res, next);
};

// Appliquer le rate limiting global à toutes les routes (sauf OPTIONS)
app.use('/api/', rateLimitedMiddleware);

// SÉCURITÉ: Limiter la taille du body JSON pour prévenir les attaques DoS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de sécurité SQL injection (appliqué à toutes les routes)
app.use(sqlInjectionDetection);

// Configuration SQL Server
const config = {
    server: process.env.DB_SERVER || 'localhost',
    authentication: {
        type: 'default',
        options: {
            userName: process.env.DB_USER || 'lounnaci',
            password: process.env.DB_PASSWORD || 'Lounnaci2026!'
        }
    },
    options: {
        database: process.env.DB_DATABASE || 'ADE_KPI',
        trustServerCertificate: true,
        encrypt: false,
        instanceName: 'SQLEXPRESS',
        enableArithAbort: true
    }
};

// Test de connexion
app.get('/api/test', (req, res) => {
    const connection = new Connection(config);

    connection.on('connect', (err) => {
        if (err) {
            console.error('❌ Erreur de connexion:', err.message);
            res.status(500).json({ error: err.message });
        } else {
            let result = [];
            
            const request = new Request('SELECT DB_NAME() as DatabaseName', (err, rowCount) => {
                if (err) {
                    console.error('Erreur requête:', err.message);
                    res.status(500).json({ error: err.message });
                } else {
                    res.json({ 
                        message: 'Connexion à SQL Server réussie !',
                        database: result[0]?.DatabaseName || process.env.DB_DATABASE,
                        user: process.env.DB_USER,
                        rowCount: rowCount
                    });
                }
                connection.close();
            });

            request.on('row', (columns) => {
                let row = {};
                columns.forEach(column => {
                    row[column.metadata.colName] = column.value;
                });
                result.push(row);
            });

            connection.execSql(request);
        }
    });

    connection.connect();
});

// Routes
// SÉCURITÉ: Rate limiting strict pour les routes d'authentification
app.post('/api/login', authRateLimiter, login);
// SÉCURITÉ: Route setup-admin sensible - devrait être protégée ou accessible uniquement en environnement de développement
// Pour production, retirer cette route ou la protéger avec une clé secrète
if (process.env.NODE_ENV !== 'production') {
    app.get('/api/setup-admin', authRateLimiter, createAdmin);
} else {
    // En production, cette route doit être protégée par une clé secrète
    app.get('/api/setup-admin', (req, res) => {
        const secretKey = req.query?.secret || req.headers['x-admin-secret'];
        if (secretKey !== process.env.ADMIN_SETUP_SECRET) {
            return res.status(403).json({ 
                error: 'Accès refusé',
                message: 'Cette route nécessite une clé secrète en production'
            });
        }
        authRateLimiter(req, res, () => createAdmin(req, res));
    });
}
app.use("/api/agences", agenceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/me", meRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/kpi", kpiRoutes);
app.use("/api/objectives", objectivesRoutes);
app.use("/api/centres", centresRoutes);
app.use("/api/communes", communesRoutes);


// ─── Middleware global de gestion d'erreurs (doit être en dernier) ────────────
app.use(errorHandler);

// Lancement du serveur
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
    console.log(`🧩 Test: http://localhost:${PORT}/api/test`);
});
