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

// ✅ Récupérer toutes les agences
router.get('/', (req, res) => {
    const connection = new Connection(getConfig());

    connection.on('connect', (err) => {
        if (err) {
            return res.status(500).json({ 
                message: 'Erreur de connexion à la base de données', 
                error: err.message 
            });
        }

        let agences = [];

        const query = 'SELECT * FROM DIM_AGENCE ORDER BY AgenceId';

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
    if (!Nom_Agence || !Adresse || !Telephone) {
        return res.status(400).json({ 
            message: 'Les champs Nom_Agence, Adresse et Telephone sont obligatoires' 
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
            (Nom_Agence, Adresse, Telephone, Email, Fax, Nom_Banque, Compte_Bancaire, NIF, NCI, CreatedAt)
            OUTPUT INSERTED.AgenceId
            VALUES (@Nom_Agence, @Adresse, @Telephone, @Email, @Fax, @Nom_Banque, @Compte_Bancaire, @NIF, @NCI, @CreatedAt)
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
    if (!Nom_Agence || !Adresse || !Telephone) {
        return res.status(400).json({ 
            message: 'Les champs Nom_Agence, Adresse et Telephone sont obligatoires' 
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
            SET Nom_Agence = @Nom_Agence, 
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

module.exports = router;