const express = require('express');
const { Connection, Request, TYPES } = require('tedious');

const router = express.Router();

// Configuration de connexion (identique à auth.js)
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

// Helpers role/agency from headers (since no auth middleware/token yet)
function getRole(req) {
    return (req.headers['x-role'] || '').toString();
}
function getUserAgenceId(req) {
    const val = req.headers['x-user-agence'] || req.headers['x-agence-id'] || '';
    const n = parseInt(val, 10);
    return Number.isNaN(n) ? null : n;
}

// ✅ Récupérer les agences (Standard => uniquement son agence; Admin => toutes)
router.get('/', (req, res) => {
    const connection = new Connection(getConfig());

    connection.on('connect', (err) => {
        if (err) {
            return res.status(500).json({ 
                message: 'Erreur de connexion à la base de données', 
                error: err.message 
            });
        }

        const role = getRole(req);
        const userAgenceId = getUserAgenceId(req);

        let agences = [];
        let query = `
            SELECT 
                a.AgenceId,
                a.FK_Centre,
                a.Nom_Agence,
                a.Adresse,
                a.Telephone,
                a.Email,
                a.Fax,
                a.Nom_Banque,
                a.Compte_Bancaire,
                a.NIF,
                a.NCI,
                a.CreatedAt,
                c.Nom_Centre
            FROM DIM_AGENCE a
            LEFT JOIN DIM_CENTRE c ON a.FK_Centre = c.CentreId
        `;
        if (role !== 'Administrateur') {
            if (!userAgenceId) {
                connection.close();
                return res.status(403).json({ message: 'Agence de l\'utilisateur non fournie' });
            }
            query += ` WHERE a.AgenceId = ${userAgenceId}`;
        }
        query += ' ORDER BY a.AgenceId';

        const request = new Request(query, (err, rowCount) => {
            connection.close();

            if (err) {
                return res.status(500).json({ 
                    message: 'Erreur lors du chargement des agences', 
                    error: err.message 
                });
            }

            res.json(agences);
        });

        request.on('row', (columns) => {
            let row = {};
            columns.forEach(column => {
                row[column.metadata.colName] = column.value;
            });
            agences.push(row);
        });

        connection.execSql(request);
    });

    connection.connect();
});

// ✅ Ajouter une nouvelle agence
router.post('/', (req, res) => {
    const roleHeader = (req.headers['x-role'] || '').toString();
    if (roleHeader !== 'Administrateur') {
        return res.status(403).json({ message: 'Accès refusé: droits insuffisants' });
    }
    const { 
        FK_Centre,
        Nom_Agence, 
        Adresse, 
        Telephone, 
        Email, 
        Fax, 
        Nom_Banque, 
        Compte_Bancaire, 
        NIF, 
        NCI 
    } = req.body;

    // Validation
    if (!FK_Centre || !Nom_Agence || !Adresse || !Telephone) {
        return res.status(400).json({ 
            message: 'Les champs Centre, Nom_Agence, Adresse et Telephone sont obligatoires' 
        });
    }

    const connection = new Connection(getConfig());

    connection.on('connect', (err) => {
        if (err) {
            return res.status(500).json({ 
                message: 'Erreur de connexion à la base de données', 
                error: err.message 
            });
        }

        const query = `
            INSERT INTO DIM_AGENCE 
            (FK_Centre, Nom_Agence, Adresse, Telephone, Email, Fax, Nom_Banque, Compte_Bancaire, NIF, NCI, CreatedAt)
            OUTPUT INSERTED.AgenceId
            VALUES (@FK_Centre, @Nom_Agence, @Adresse, @Telephone, @Email, @Fax, @Nom_Banque, @Compte_Bancaire, @NIF, @NCI, @CreatedAt)
        `;

        let insertedId = null;

        const request = new Request(query, (err, rowCount) => {
            connection.close();

            if (err) {
                return res.status(500).json({ 
                    message: 'Erreur lors de l\'ajout de l\'agence', 
                    error: err.message 
                });
            }

            res.json({ 
                message: 'Agence ajoutée avec succès', 
                id: insertedId 
            });
        });

        request.addParameter('FK_Centre', TYPES.Int, parseInt(FK_Centre));
        request.addParameter('Nom_Agence', TYPES.NVarChar, Nom_Agence);
        request.addParameter('Adresse', TYPES.NVarChar, Adresse);
        request.addParameter('Telephone', TYPES.NVarChar, Telephone);
        request.addParameter('Email', TYPES.NVarChar, Email || null);
        request.addParameter('Fax', TYPES.NVarChar, Fax || null);
        request.addParameter('Nom_Banque', TYPES.NVarChar, Nom_Banque || null);
        request.addParameter('Compte_Bancaire', TYPES.NVarChar, Compte_Bancaire || null);
        request.addParameter('NIF', TYPES.NVarChar, NIF || null);
        request.addParameter('NCI', TYPES.NVarChar, NCI || null);
        request.addParameter('CreatedAt', TYPES.DateTime2, new Date());

        request.on('row', (columns) => {
            columns.forEach(column => {
                if (column.metadata.colName === 'AgenceId') {
                    insertedId = column.value;
                }
            });
        });

        connection.execSql(request);
    });

    connection.connect();
});

// ✅ Modifier une agence existante
router.put('/:id', (req, res) => {
    const roleHeader = (req.headers['x-role'] || '').toString();
    if (roleHeader !== 'Administrateur') {
        return res.status(403).json({ message: 'Accès refusé: droits insuffisants' });
    }
    const { id } = req.params;
    const { 
        FK_Centre,
        Nom_Agence, 
        Adresse, 
        Telephone, 
        Email, 
        Fax, 
        Nom_Banque, 
        Compte_Bancaire, 
        NIF, 
        NCI 
    } = req.body;

    // Validation
    if (!FK_Centre || !Nom_Agence || !Adresse || !Telephone) {
        return res.status(400).json({ 
            message: 'Les champs Centre, Nom_Agence, Adresse et Telephone sont obligatoires' 
        });
    }

    const connection = new Connection(getConfig());

    connection.on('connect', (err) => {
        if (err) {
            return res.status(500).json({ 
                message: 'Erreur de connexion à la base de données', 
                error: err.message 
            });
        }

        const query = `
            UPDATE DIM_AGENCE 
            SET FK_Centre = @FK_Centre,
                Nom_Agence = @Nom_Agence, 
                Adresse = @Adresse, 
                Telephone = @Telephone, 
                Email = @Email, 
                Fax = @Fax,
                Nom_Banque = @Nom_Banque, 
                Compte_Bancaire = @Compte_Bancaire, 
                NIF = @NIF, 
                NCI = @NCI
            WHERE AgenceId = @AgenceId
        `;

        const request = new Request(query, (err, rowCount) => {
            connection.close();

            if (err) {
                return res.status(500).json({ 
                    message: 'Erreur lors de la modification de l\'agence', 
                    error: err.message 
                });
            }

            if (rowCount === 0) {
                return res.status(404).json({ 
                    message: 'Agence non trouvée' 
                });
            }

            res.json({ 
                message: 'Agence modifiée avec succès' 
            });
        });

        request.addParameter('AgenceId', TYPES.Int, parseInt(id));
        request.addParameter('FK_Centre', TYPES.Int, parseInt(FK_Centre));
        request.addParameter('Nom_Agence', TYPES.NVarChar, Nom_Agence);
        request.addParameter('Adresse', TYPES.NVarChar, Adresse);
        request.addParameter('Telephone', TYPES.NVarChar, Telephone);
        request.addParameter('Email', TYPES.NVarChar, Email || null);
        request.addParameter('Fax', TYPES.NVarChar, Fax || null);
        request.addParameter('Nom_Banque', TYPES.NVarChar, Nom_Banque || null);
        request.addParameter('Compte_Bancaire', TYPES.NVarChar, Compte_Bancaire || null);
        request.addParameter('NIF', TYPES.NVarChar, NIF || null);
        request.addParameter('NCI', TYPES.NVarChar, NCI || null);

        connection.execSql(request);
    });

    connection.connect();
});

// ✅ Récupérer la liste des centres pour le formulaire
router.get('/centres', (req, res) => {
    const connection = new Connection(getConfig());

    connection.on('connect', (err) => {
        if (err) {
            return res.status(500).json({ 
                message: 'Erreur de connexion à la base de données', 
                error: err.message 
            });
        }

        const query = 'SELECT CentreId, Nom_Centre FROM DIM_CENTRE ORDER BY Nom_Centre';
        const centres = [];

        const request = new Request(query, (err, rowCount) => {
            connection.close();

            if (err) {
                return res.status(500).json({ 
                    message: 'Erreur lors du chargement des centres', 
                    error: err.message 
                });
            }

            res.json(centres);
        });

        request.on('row', (columns) => {
            let row = {};
            columns.forEach(column => {
                row[column.metadata.colName] = column.value;
            });
            centres.push(row);
        });

        connection.execSql(request);
    });

    connection.connect();
});

// ✅ Supprimer une agence (admin uniquement)
router.delete('/:id', (req, res) => {
    const roleHeader = (req.headers['x-role'] || '').toString();
    if (roleHeader !== 'Administrateur') {
        return res.status(403).json({ message: 'Accès refusé: droits insuffisants' });
    }
    const { id } = req.params;

    const connection = new Connection(getConfig());

    connection.on('connect', (err) => {
        if (err) {
            return res.status(500).json({ 
                message: 'Erreur de connexion à la base de données', 
                error: err.message 
            });
        }

        const request = new Request('DELETE FROM DIM_AGENCE WHERE AgenceId = @AgenceId', (err, rowCount) => {
            connection.close();
            if (err) {
                return res.status(500).json({ message: 'Erreur lors de la suppression de l\'agence', error: err.message });
            }
            if (rowCount === 0) {
                return res.status(404).json({ message: 'Agence non trouvée' });
            }
            res.json({ message: 'Agence supprimée avec succès' });
        });

        request.addParameter('AgenceId', TYPES.Int, parseInt(id, 10));

        connection.execSql(request);
    });

    connection.connect();
});

module.exports = router;