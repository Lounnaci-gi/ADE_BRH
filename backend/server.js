const express = require('express');
const { Connection, Request } = require('tedious');
const cors = require('cors');
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

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
// Ensure correct client IP detection behind proxies
app.set('trust proxy', true);

// Configuration SQL Server
const config = {
    server: process.env.DB_SERVER,
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
};

// Test de connexion
app.get('/api/test', (req, res) => {
    const connection = new Connection(config);

    connection.on('connect', (err) => {
        if (err) {
            console.error('❌ Erreur de connexion:', err.message);
            res.status(500).json({ error: err.message });
        } else {
            console.log('✅ Connexion réussie !');
            
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
app.post('/api/login', login);
app.get('/api/setup-admin', createAdmin);
app.use("/api/agences", agenceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/me", meRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/kpi", kpiRoutes);
app.use("/api/objectives", objectivesRoutes);
app.use("/api/centres", centresRoutes);
app.use("/api/communes", communesRoutes);


// Lancement du serveur
app.listen(PORT,"0.0.0.0", () => {
    console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
    console.log(`🧩 Test: http://localhost:${PORT}/api/test`);
});
