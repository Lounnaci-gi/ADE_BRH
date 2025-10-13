const express = require('express');
const { TYPES } = require('tedious');
const db = require('../utils/db');
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
router.get('/', async (req, res) => {
  const role = getRole(req);
  
  if (role !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent consulter les objectifs.' });
  }

  try {
    // Récupérer les paramètres de filtrage
    const { annee, mois } = req.query;
    
    let whereClause = `WHERE (f.Obj_Coupures IS NOT NULL 
         OR f.Obj_Dossiers_Juridiques IS NOT NULL 
         OR f.Obj_MisesEnDemeure_Envoyees IS NOT NULL 
         OR f.Obj_Relances_Envoyees IS NOT NULL)`;
    
    // Ajouter le filtrage par année et mois si spécifiés
    if (annee && mois) {
      whereClause += ` AND d.[Year] = ${parseInt(annee)} AND d.[Month] = ${parseInt(mois)}`;
    } else if (annee) {
      whereClause += ` AND d.[Year] = ${parseInt(annee)}`;
    } else if (mois) {
      whereClause += ` AND d.[Month] = ${parseInt(mois)}`;
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
      ${whereClause}
      ORDER BY d.[Year] DESC, d.[Month] DESC, a.Nom_Agence
    `;

    const results = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error('Erreur GET /objectives:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des objectifs', error: err.message });
  }
});

// GET /api/objectives/agences - Liste des agences pour le formulaire
router.get('/agences', async (req, res) => {
  const role = getRole(req);
  
  if (role !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent consulter les agences.' });
  }

  try {
    const query = 'SELECT AgenceId, Nom_Agence FROM dbo.DIM_AGENCE ORDER BY Nom_Agence';
    const results = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error('Erreur GET /objectives/agences:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des agences', error: err.message });
  }
});

// POST /api/objectives - Créer ou mettre à jour un objectif
router.post('/', async (req, res) => {
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

  try {
    // Calculer DateKey (YYYYMM01)
    const dateKey = parseInt(`${annee}${mois.toString().padStart(2, '0')}01`);

    // Vérifier d'abord si la table existe
    const checkTableQuery = `
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'FAIT_KPI_ADE' AND TABLE_SCHEMA = 'dbo'
    `;
    
    const tableCheck = await db.query(checkTableQuery);
    
    if (tableCheck[0].count === 0) {
      return res.status(500).json({ 
        message: 'Table FAIT_KPI_ADE non trouvée', 
        error: 'La table des objectifs n\'existe pas dans la base de données' 
      });
    }
    
    // Si la table existe, procéder à l'insertion
    const insertQuery = `
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
    
    const params = [
      { name: 'agenceId', type: TYPES.Int, value: agenceId },
      { name: 'dateKey', type: TYPES.Int, value: dateKey },
      { name: 'objectif_Coupures', type: TYPES.Int, value: objectif_Coupures || null },
      { name: 'objectif_Dossiers_Juridiques', type: TYPES.Int, value: objectif_Dossiers_Juridiques || null },
      { name: 'objectif_MisesEnDemeure_Envoyees', type: TYPES.Int, value: objectif_MisesEnDemeure_Envoyees || null },
      { name: 'objectif_Relances_Envoyees', type: TYPES.Int, value: objectif_Relances_Envoyees || null }
    ];
    
    const result = await db.query(insertQuery, params);
    res.json({ 
      message: 'Objectifs sauvegardés avec succès',
      result: result
    });
  } catch (err) {
    console.error('Erreur POST /objectives:', err);
    res.status(500).json({ message: 'Erreur lors de la sauvegarde', error: err.message });
  }
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
