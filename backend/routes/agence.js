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
    
    // SÉCURITÉ: Vérification stricte de l'authentification
    if (!role || (role !== 'Administrateur' && role !== 'Standard')) {
        return res.status(401).json({ message: 'Authentification requise. Connexion nécessaire.' });
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
                a.CreatedAt,
                c.Nom_Centre,
                c.Adresse as Centre_Adresse,
                c.Telephone as Centre_Telephone,
                c.Email as Centre_Email,
                c.Fax as Centre_Fax
            FROM dbo.DIM_AGENCE a
            LEFT JOIN dbo.DIM_CENTRE c ON a.FK_Centre = c.CentreId
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
    const roleHeader = (req.headers['x-role'] || '').toString().trim();
    // SÉCURITÉ: Vérification stricte - rejeter si pas d'authentification
    if (!roleHeader) {
        return res.status(401).json({ message: 'Authentification requise' });
    }
    if (roleHeader !== 'Administrateur') {
        return res.status(403).json({ message: 'Accès refusé: droits administrateur requis' });
    }
    const { 
        FK_Centre,
        Nom_Agence, 
        Adresse, 
        Telephone, 
        Email, 
        Fax
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
            (FK_Centre, Nom_Agence, Adresse, Telephone, Email, Fax, CreatedAt)
            OUTPUT INSERTED.AgenceId INTO @t
            VALUES (@FK_Centre, @Nom_Agence, @Adresse, @Telephone, @Email, @Fax, SYSUTCDATETIME());
            SELECT AgenceId FROM @t;`;

        const rows = await db.query(insertSql, [
            { name: 'FK_Centre', type: TYPES.Int, value: parseInt(FK_Centre, 10) },
            { name: 'Nom_Agence', type: TYPES.NVarChar, value: Nom_Agence },
            { name: 'Adresse', type: TYPES.NVarChar, value: Adresse },
            { name: 'Telephone', type: TYPES.NVarChar, value: Telephone },
            { name: 'Email', type: TYPES.NVarChar, value: Email || null },
            { name: 'Fax', type: TYPES.NVarChar, value: Fax || null }
        ]);

        return res.status(201).json({ message: 'Agence ajoutée avec succès', id: rows[0]?.AgenceId });
    } catch (err) {
        console.error('Erreur POST /agences:', err);
        return res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'agence', error: err.message });
    }
});

// ✅ Modifier une agence existante
router.put('/:id', (req, res) => {
    const roleHeader = (req.headers['x-role'] || '').toString().trim();
    // SÉCURITÉ: Vérification stricte - rejeter si pas d'authentification
    if (!roleHeader) {
        return res.status(401).json({ message: 'Authentification requise' });
    }
    if (roleHeader !== 'Administrateur') {
        return res.status(403).json({ message: 'Accès refusé: droits administrateur requis' });
    }
    const { id } = req.params;
    const { 
        FK_Centre,
        Nom_Agence, 
        Adresse, 
        Telephone, 
        Email, 
        Fax
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
                Fax = @Fax
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

        connection.execSql(request);
    });

    connection.connect();
});

// ✅ Récupérer la liste des centres pour le formulaire
router.get('/centres', async (req, res) => {
    try {
        const query = `
            SELECT 
                CentreId, 
                Nom_Centre,
                Adresse,
                Telephone,
                Email,
                Fax
            FROM dbo.DIM_CENTRE 
            ORDER BY Nom_Centre
        `;
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

// ✅ Supprimer une agence (admin uniquement) avec vérification des dépendances
router.delete('/:id', async (req, res) => {
    const roleHeader = (req.headers['x-role'] || '').toString().trim();
    // SÉCURITÉ: Vérification stricte - rejeter si pas d'authentification
    if (!roleHeader) {
        return res.status(401).json({ message: 'Authentification requise' });
    }
    if (roleHeader !== 'Administrateur') {
        return res.status(403).json({ message: 'Accès refusé: droits administrateur requis' });
    }
    const { id } = req.params;

    try {
        // Vérifier si l'agence existe
        const agenceExists = await db.query(
            'SELECT AgenceId, Nom_Agence FROM dbo.DIM_AGENCE WHERE AgenceId = @AgenceId',
            [{ name: 'AgenceId', type: TYPES.Int, value: parseInt(id, 10) }]
        );

        if (agenceExists.length === 0) {
            return res.status(404).json({ message: 'Agence non trouvée' });
        }

        const agenceName = agenceExists[0].Nom_Agence;

        // Vérifier les dépendances
        const dependencies = [];

        // 1. Vérifier les utilisateurs liés à cette agence
        const usersCount = await db.query(
            'SELECT COUNT(*) as count FROM dbo.DIM_UTILISATEUR WHERE FK_Agence = @AgenceId',
            [{ name: 'AgenceId', type: TYPES.Int, value: parseInt(id, 10) }]
        );
        if (usersCount[0].count > 0) {
            dependencies.push(`${usersCount[0].count} utilisateur(s) lié(s) à cette agence`);
        }

        // 2. Vérifier les KPIs liés à cette agence
        const kpisCount = await db.query(
            'SELECT COUNT(*) as count FROM dbo.FAIT_KPI_ADE WHERE AgenceId = @AgenceId',
            [{ name: 'AgenceId', type: TYPES.Int, value: parseInt(id, 10) }]
        );
        if (kpisCount[0].count > 0) {
            dependencies.push(`${kpisCount[0].count} enregistrement(s) KPI lié(s) à cette agence`);
        }

        // 3. Vérifier les objectifs liés à cette agence
        const objectivesCount = await db.query(
            'SELECT COUNT(*) as count FROM dbo.DIM_OBJECTIF WHERE FK_Agence = @AgenceId',
            [{ name: 'AgenceId', type: TYPES.Int, value: parseInt(id, 10) }]
        );
        if (objectivesCount[0].count > 0) {
            dependencies.push(`${objectivesCount[0].count} objectif(s) lié(s) à cette agence`);
        }

        // 4. Vérifier les communes liées à cette agence
        const communesCount = await db.query(
            'SELECT COUNT(*) as count FROM dbo.DIM_COMMUNE WHERE FK_Agence = @AgenceId',
            [{ name: 'AgenceId', type: TYPES.Int, value: parseInt(id, 10) }]
        );
        if (communesCount[0].count > 0) {
            dependencies.push(`${communesCount[0].count} commune(s) liée(s) à cette agence`);
        }

        // Si des dépendances existent, empêcher la suppression
        if (dependencies.length > 0) {
            const message = `Impossible de supprimer l'agence "${agenceName}". ` +
                `Les éléments suivants sont liés à cette agence : ${dependencies.join(', ')}. ` +
                `Veuillez d'abord supprimer ou réassigner ces éléments.`;
            return res.status(409).json({ 
                message: message,
                dependencies: dependencies,
                canDelete: false
            });
        }

        // Aucune dépendance, procéder à la suppression
        const deleteResult = await db.query(
            'DELETE FROM dbo.DIM_AGENCE WHERE AgenceId = @AgenceId',
            [{ name: 'AgenceId', type: TYPES.Int, value: parseInt(id, 10) }]
        );

        res.json({ 
            message: `Agence "${agenceName}" supprimée avec succès`,
            canDelete: true
        });

    } catch (err) {
        console.error('Erreur DELETE /agences/:id:', err);
        return res.status(500).json({ 
            message: 'Erreur lors de la suppression de l\'agence', 
            error: err.message 
        });
    }
});

// GET /api/agences/centres - Récupérer la liste des centres
// Duplicate legacy handler removed; unified above using db.query

// GET /api/agences/count - Nombre total d'agences (lecture pour tous les utilisateurs connectés)
router.get('/count', async (req, res) => {
  const role = getRole(req);
  
  // SÉCURITÉ: Vérification stricte de l'authentification
  if (!role || (role !== 'Administrateur' && role !== 'Standard')) {
    return res.status(401).json({ message: 'Authentification requise. Connexion nécessaire.' });
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