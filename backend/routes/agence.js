const express = require('express');
const { Connection, Request, TYPES } = require('tedious');
const db = require('../utils/db');

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

// ✅ Récupérer les agences (lecture pour tous les utilisateurs connectés)
router.get('/', async (req, res) => {
    const role = getRole(req);
    
    // Permettre la lecture pour tous les utilisateurs connectés (Administrateur et Standard)
    if (!role || (role !== 'Administrateur' && role !== 'Standard')) {
        return res.status(403).json({ message: 'Accès refusé. Connexion requise.' });
    }

    try {
        const query = `
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
            ORDER BY a.AgenceId
        `;

        const results = await db.query(query);
        res.json(results);
    } catch (err) {
        console.error('Erreur GET /agences:', err);
        res.status(500).json({ 
                    message: 'Erreur lors du chargement des agences', 
                    error: err.message 
                });
            }
});

// ✅ Ajouter une nouvelle agence
router.post('/', async (req, res) => {
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

    try {
        const exists = await db.query(
            'SELECT AgenceId FROM dbo.DIM_AGENCE WHERE Nom_Agence = @Nom_Agence',
            [{ name: 'Nom_Agence', type: TYPES.NVarChar, value: Nom_Agence }]
        );
        if (exists.length > 0) {
            return res.status(409).json({ message: 'Une agence avec ce nom existe déjà' });
        }

        const insertSql = `
            DECLARE @t TABLE(AgenceId INT);
            INSERT INTO dbo.DIM_AGENCE 
            (FK_Centre, Nom_Agence, Adresse, Telephone, Email, Fax, Nom_Banque, Compte_Bancaire, NIF, NCI, CreatedAt)
            OUTPUT INSERTED.AgenceId INTO @t
            VALUES (@FK_Centre, @Nom_Agence, @Adresse, @Telephone, @Email, @Fax, @Nom_Banque, @Compte_Bancaire, @NIF, @NCI, SYSUTCDATETIME());
            SELECT AgenceId FROM @t;`;

        const rows = await db.query(insertSql, [
            { name: 'FK_Centre', type: TYPES.Int, value: parseInt(FK_Centre, 10) },
            { name: 'Nom_Agence', type: TYPES.NVarChar, value: Nom_Agence },
            { name: 'Adresse', type: TYPES.NVarChar, value: Adresse },
            { name: 'Telephone', type: TYPES.NVarChar, value: Telephone },
            { name: 'Email', type: TYPES.NVarChar, value: Email || null },
            { name: 'Fax', type: TYPES.NVarChar, value: Fax || null },
            { name: 'Nom_Banque', type: TYPES.NVarChar, value: Nom_Banque || null },
            { name: 'Compte_Bancaire', type: TYPES.NVarChar, value: Compte_Bancaire || null },
            { name: 'NIF', type: TYPES.NVarChar, value: NIF || null },
            { name: 'NCI', type: TYPES.NVarChar, value: NCI || null }
        ]);

        return res.status(201).json({ message: 'Agence ajoutée avec succès', id: rows[0]?.AgenceId });
    } catch (err) {
        console.error('Erreur POST /agences:', err);
        return res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'agence', error: err.message });
    }
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
router.get('/centres', async (req, res) => {
    try {
        const query = 'SELECT CentreId, Nom_Centre FROM DIM_CENTRE ORDER BY Nom_Centre';
        const centres = await db.query(query);
        res.json(centres);
    } catch (err) {
        console.error('Erreur GET /agences/centres:', err);
        res.status(500).json({ 
            message: 'Erreur lors du chargement des centres', 
            error: err.message 
        });
    }
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

// GET /api/agences/centres - Récupérer la liste des centres
// Duplicate legacy handler removed; unified above using db.query

// GET /api/agences/count - Nombre total d'agences (lecture pour tous les utilisateurs connectés)
router.get('/count', async (req, res) => {
  const role = getRole(req);
  
  // Permettre la lecture pour tous les utilisateurs connectés (Administrateur et Standard)
  if (!role || (role !== 'Administrateur' && role !== 'Standard')) {
    return res.status(403).json({ message: 'Accès refusé. Connexion requise.' });
  }

  try {
    const query = 'SELECT COUNT(*) as count FROM dbo.DIM_AGENCE';
    const results = await db.query(query);
    res.json({ count: results[0].count });
  } catch (err) {
    console.error('Erreur GET /agences/count:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération du nombre d\'agences', error: err.message });
  }
});

module.exports = router;