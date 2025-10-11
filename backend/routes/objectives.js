const express = require('express');
const { Connection, Request, TYPES } = require('tedious');
const router = express.Router();

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

// Helper pour obtenir le rôle et l'ID utilisateur
const getRole = (req) => (req.headers['x-role'] || '').toString();
const getUserId = (req) => parseInt(req.headers['x-user-id'], 10) || null;

// GET /api/objectives - Liste des objectifs (Admin seulement)
router.get('/', (req, res) => {
  const role = getRole(req);
  
  if (role !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent consulter les objectifs.' });
  }

  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur de connexion à la base', error: err.message });
    }

    const query = `
      SELECT DISTINCT
        f.AgenceId,
        a.Nom_Agence,
        d.[Year] AS Annee,
        d.[Month] AS Mois,
        f.DateKey,
        f.Obj_Coupures,
        f.Obj_Dossiers_Juridiques,
        f.Obj_MisesEnDemeure_Envoyees,
        f.Obj_Relances_Envoyees,
        f.CreatedAt,
        f.ModifiedAt
      FROM dbo.FAIT_KPI_ADE f
      INNER JOIN dbo.DIM_AGENCE a ON f.AgenceId = a.AgenceId
      INNER JOIN dbo.DIM_DATE d ON f.DateKey = d.DateKey
      WHERE (f.Obj_Coupures IS NOT NULL 
         OR f.Obj_Dossiers_Juridiques IS NOT NULL 
         OR f.Obj_MisesEnDemeure_Envoyees IS NOT NULL 
         OR f.Obj_Relances_Envoyees IS NOT NULL)
      ORDER BY d.[Year] DESC, d.[Month] DESC, a.Nom_Agence
    `;

    const results = [];
    let hasResponded = false;

    const request = new Request(query, (err, rowCount) => {
      if (err) {
        if (!hasResponded) {
          hasResponded = true;
          connection.close();
          return res.status(500).json({ message: 'Erreur lors de la requête', error: err.message });
        }
      }
    });

    request.on('row', (columns) => {
      const row = {};
      columns.forEach(column => {
        row[column.metadata.colName] = column.value;
      });
      results.push(row);
    });

    request.on('requestCompleted', () => {
      if (!hasResponded) {
        hasResponded = true;
        connection.close();
        res.json(results);
      }
    });

    connection.execSql(request);
  });

  connection.connect();
});

// GET /api/objectives/agences - Liste des agences pour le formulaire
router.get('/agences', (req, res) => {
  const role = getRole(req);
  
  if (role !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent consulter les agences.' });
  }

  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur de connexion à la base', error: err.message });
    }

    const query = 'SELECT AgenceId, Nom_Agence FROM dbo.DIM_AGENCE ORDER BY Nom_Agence';

    const results = [];
    let hasResponded = false;

    const request = new Request(query, (err, rowCount) => {
      if (err) {
        if (!hasResponded) {
          hasResponded = true;
          connection.close();
          return res.status(500).json({ message: 'Erreur lors de la requête', error: err.message });
        }
      }
    });

    request.on('row', (columns) => {
      const row = {};
      columns.forEach(column => {
        row[column.metadata.colName] = column.value;
      });
      results.push(row);
    });

    request.on('requestCompleted', () => {
      if (!hasResponded) {
        hasResponded = true;
        connection.close();
        res.json(results);
      }
    });

    connection.execSql(request);
  });

  connection.connect();
});

// POST /api/objectives - Créer ou mettre à jour un objectif
router.post('/', (req, res) => {
  const role = getRole(req);
  const userId = getUserId(req);
  
  if (role !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent définir les objectifs.' });
  }

  const {
    agenceId,
    annee,
    mois,
    objectif_Coupures,
    objectif_Dossiers_Juridiques,
    objectif_MisesEnDemeure_Envoyees,
    objectif_Relances_Envoyees
  } = req.body;

  // Validation
  if (!agenceId || !annee || !mois) {
    return res.status(400).json({ message: 'Agence, année et mois sont requis' });
  }

  if (mois < 1 || mois > 12) {
    return res.status(400).json({ message: 'Le mois doit être entre 1 et 12' });
  }

  if (annee < 2020 || annee > 2030) {
    return res.status(400).json({ message: 'L\'année doit être entre 2020 et 2030' });
  }

  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur de connexion à la base', error: err.message });
    }

    // Calculer DateKey (YYYYMM01)
    const dateKey = parseInt(`${annee}${mois.toString().padStart(2, '0')}01`);

    // Pour l'instant, simuler la sauvegarde car la table FAIT_KPI_ADE n'a pas de données
    // DateKey du mois suivant
    const nextMonth = mois === 12 ? 1 : mois + 1;
    const nextYear = mois === 12 ? annee + 1 : annee;
    const nextMonthDateKey = parseInt(`${nextYear}${nextMonth.toString().padStart(2, '0')}01`);

    // Requête simple pour créer un enregistrement de test
    const query = `
      INSERT INTO dbo.FAIT_KPI_ADE (
        DateKey, AgenceId, CategorieId, 
        Obj_Coupures, Obj_Dossiers_Juridiques, 
        Obj_MisesEnDemeure_Envoyees, Obj_Relances_Envoyees,
        CreatedAt
      )
      VALUES (
        @dateKey, @agenceId, 1,
        @objectif_Coupures, @objectif_Dossiers_Juridiques,
        @objectif_MisesEnDemeure_Envoyees, @objectif_Relances_Envoyees,
        SYSUTCDATETIME()
      )
    `;

    const request = new Request(query, (err, rowCount) => {
      if (err) {
        connection.close();
        return res.status(500).json({ message: 'Erreur lors de la sauvegarde', error: err.message });
      }
      connection.close();
      res.json({ 
        message: 'Objectifs sauvegardés avec succès',
        rowsAffected: rowCount
      });
    });

    // Paramètres
    request.addParameter('agenceId', TYPES.Int, agenceId);
    request.addParameter('dateKey', TYPES.Int, dateKey);
    request.addParameter('objectif_Coupures', TYPES.Int, objectif_Coupures || null);
    request.addParameter('objectif_Dossiers_Juridiques', TYPES.Int, objectif_Dossiers_Juridiques || null);
    request.addParameter('objectif_MisesEnDemeure_Envoyees', TYPES.Int, objectif_MisesEnDemeure_Envoyees || null);
    request.addParameter('objectif_Relances_Envoyees', TYPES.Int, objectif_Relances_Envoyees || null);

    connection.execSql(request);
  });

  connection.connect();
});

// DELETE /api/objectives - Supprimer les objectifs d'une agence pour un mois
router.delete('/', (req, res) => {
  const role = getRole(req);
  
  if (role !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent supprimer les objectifs.' });
  }

  const { agenceId, annee, mois } = req.body;
  
  if (!agenceId || !annee || !mois) {
    return res.status(400).json({ message: 'Agence, année et mois sont requis' });
  }

  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur de connexion à la base', error: err.message });
    }

    // Calculer DateKey (YYYYMM01)
    const dateKey = parseInt(`${annee}${mois.toString().padStart(2, '0')}01`);
    const nextMonth = mois === 12 ? 1 : mois + 1;
    const nextYear = mois === 12 ? annee + 1 : annee;
    const nextMonthDateKey = parseInt(`${nextYear}${nextMonth.toString().padStart(2, '0')}01`);

    const query = `
      UPDATE dbo.FAIT_KPI_ADE 
      SET 
        Obj_Coupures = NULL,
        Obj_Dossiers_Juridiques = NULL,
        Obj_MisesEnDemeure_Envoyees = NULL,
        Obj_Relances_Envoyees = NULL,
        ModifiedAt = SYSUTCDATETIME()
      WHERE AgenceId = @agenceId 
        AND DateKey >= @dateKey 
        AND DateKey < @nextMonthDateKey
    `;

    const request = new Request(query, (err, rowCount) => {
      if (err) {
        connection.close();
        return res.status(500).json({ message: 'Erreur lors de la suppression', error: err.message });
      }
      connection.close();
      
      res.json({ 
        message: 'Objectifs supprimés avec succès',
        rowsAffected: rowCount
      });
    });

    request.addParameter('agenceId', TYPES.Int, agenceId);
    request.addParameter('dateKey', TYPES.Int, dateKey);
    request.addParameter('nextMonthDateKey', TYPES.Int, nextMonthDateKey);
    connection.execSql(request);
  });

  connection.connect();
});

module.exports = router;
