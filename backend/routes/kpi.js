const express = require('express');
const { Connection, Request, TYPES } = require('tedious');
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

// GET /api/kpi - liste des KPIs avec jointures (refactor db.query)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT TOP 500
        k.DateKey,
        k.AgenceId,
        k.CategorieId,
        a.Nom_Agence,
        c.Libelle AS CategorieLibelle
      FROM dbo.FAIT_KPI_ADE AS k
      LEFT JOIN dbo.DIM_AGENCE AS a ON k.AgenceId = a.AgenceId
      LEFT JOIN dbo.DIM_CATEGORIE AS c ON k.CategorieId = c.CategorieId
      ORDER BY k.DateKey DESC, a.Nom_Agence, c.Libelle`;

    const rows = await db.query(query, []);
    res.json(rows || []);
  } catch (err) {
    console.error('Erreur GET /kpi:', err);
    res.status(500).json({ message: 'Erreur lors de la lecture des KPIs', error: err.message });
  }
});

// POST /api/kpi - créer/insérer un KPI (refactor db.query)
router.post('/', async (req, res) => {
  try {
    const {
      dateKey, agenceId, categorieId,
      encaissementJournalierGlobal, nbCoupures, mtCoupures,
      nbDossiersJuridiques, mtDossiersJuridiques,
      nbMisesEnDemeureEnvoyees, mtMisesEnDemeureEnvoyees,
      nbMisesEnDemeureReglees, mtMisesEnDemeureReglees,
      nbRelancesEnvoyees, mtRelancesEnvoyees,
      nbRelancesReglees, mtRelancesReglees,
      objCoupures, objDossiersJuridiques, objMisesEnDemeureEnvoyees, objRelancesEnvoyees
    } = req.body || {};

    if (!dateKey || !agenceId || !categorieId) {
      return res.status(400).json({ message: 'DateKey, AgenceId et CategorieId sont requis' });
    }

    // UPSERT (MERGE) avec tous les champs - INSERT si n'existe pas, UPDATE si existe
    const query = `
      MERGE dbo.FAIT_KPI_ADE AS target
      USING (SELECT @dateKey AS DateKey, @agenceId AS AgenceId, @categorieId AS CategorieId) AS source
      ON (target.DateKey = source.DateKey AND target.AgenceId = source.AgenceId AND target.CategorieId = source.CategorieId)
      WHEN MATCHED THEN
        UPDATE SET
          Nb_RelancesEnvoyees = @nbRelancesEnvoyees,
          Mt_RelancesEnvoyees = @mtRelancesEnvoyees,
          Nb_RelancesReglees = @nbRelancesReglees,
          Mt_RelancesReglees = @mtRelancesReglees,
          Nb_MisesEnDemeure_Envoyees = @nbMisesEnDemeureEnvoyees,
          Mt_MisesEnDemeure_Envoyees = @mtMisesEnDemeureEnvoyees,
          Nb_MisesEnDemeure_Reglees = @nbMisesEnDemeureReglees,
          Mt_MisesEnDemeure_Reglees = @mtMisesEnDemeureReglees,
          Nb_Dossiers_Juridiques = @nbDossiersJuridiques,
          Mt_Dossiers_Juridiques = @mtDossiersJuridiques,
          Nb_Coupures = @nbCoupures,
          Mt_Coupures = @mtCoupures,
          Encaissement_Journalier_Global = @encaissementJournalierGlobal,
          ModifiedAt = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (
          DateKey, AgenceId, CategorieId,
          Nb_RelancesEnvoyees, Mt_RelancesEnvoyees,
          Nb_RelancesReglees, Mt_RelancesReglees,
          Nb_MisesEnDemeure_Envoyees, Mt_MisesEnDemeure_Envoyees,
          Nb_MisesEnDemeure_Reglees, Mt_MisesEnDemeure_Reglees,
          Nb_Dossiers_Juridiques, Mt_Dossiers_Juridiques,
          Nb_Coupures, Mt_Coupures,
          Encaissement_Journalier_Global
        ) VALUES (
          @dateKey, @agenceId, @categorieId,
          @nbRelancesEnvoyees, @mtRelancesEnvoyees,
          @nbRelancesReglees, @mtRelancesReglees,
          @nbMisesEnDemeureEnvoyees, @mtMisesEnDemeureEnvoyees,
          @nbMisesEnDemeureReglees, @mtMisesEnDemeureReglees,
          @nbDossiersJuridiques, @mtDossiersJuridiques,
          @nbCoupures, @mtCoupures,
          @encaissementJournalierGlobal
        );
    `;

    const params = [
      { name: 'dateKey', type: TYPES.Int, value: parseInt(dateKey, 10) },
      { name: 'agenceId', type: TYPES.Int, value: parseInt(agenceId, 10) },
      { name: 'categorieId', type: TYPES.Int, value: parseInt(categorieId, 10) },
      { name: 'nbRelancesEnvoyees', type: TYPES.Int, value: parseInt(nbRelancesEnvoyees || 0, 10) },
      { name: 'mtRelancesEnvoyees', type: TYPES.Money, value: parseFloat(mtRelancesEnvoyees || 0) },
      { name: 'nbRelancesReglees', type: TYPES.Int, value: parseInt(nbRelancesReglees || 0, 10) },
      { name: 'mtRelancesReglees', type: TYPES.Money, value: parseFloat(mtRelancesReglees || 0) },
      { name: 'nbMisesEnDemeureEnvoyees', type: TYPES.Int, value: parseInt(nbMisesEnDemeureEnvoyees || 0, 10) },
      { name: 'mtMisesEnDemeureEnvoyees', type: TYPES.Money, value: parseFloat(mtMisesEnDemeureEnvoyees || 0) },
      { name: 'nbMisesEnDemeureReglees', type: TYPES.Int, value: parseInt(nbMisesEnDemeureReglees || 0, 10) },
      { name: 'mtMisesEnDemeureReglees', type: TYPES.Money, value: parseFloat(mtMisesEnDemeureReglees || 0) },
      { name: 'nbDossiersJuridiques', type: TYPES.Int, value: parseInt(nbDossiersJuridiques || 0, 10) },
      { name: 'mtDossiersJuridiques', type: TYPES.Money, value: parseFloat(mtDossiersJuridiques || 0) },
      { name: 'nbCoupures', type: TYPES.Int, value: parseInt(nbCoupures || 0, 10) },
      { name: 'mtCoupures', type: TYPES.Money, value: parseFloat(mtCoupures || 0) },
      { name: 'encaissementJournalierGlobal', type: TYPES.Money, value: parseFloat(encaissementJournalierGlobal || 0) }
    ];

    console.log('Attempting to upsert KPI with all fields:', { 
      dateKey, agenceId, categorieId,
      nbRelancesEnvoyees, mtRelancesEnvoyees,
      nbRelancesReglees, mtRelancesReglees,
      nbMisesEnDemeureEnvoyees, mtMisesEnDemeureEnvoyees,
      nbMisesEnDemeureReglees, mtMisesEnDemeureReglees,
      nbDossiersJuridiques, mtDossiersJuridiques,
      nbCoupures, mtCoupures,
      encaissementJournalierGlobal
    });
    await db.query(query, params);
    res.status(200).json({ message: 'KPI sauvegardé avec succès' });
  } catch (err) {
    console.error('Erreur POST /kpi:', err);
    console.error('Query:', query);
    console.error('Params:', params);
    res.status(500).json({ message: 'Erreur lors de la sauvegarde du KPI', error: err.message });
  }
});

// GET /api/kpi/existing - récupérer les données KPI existantes pour une date/agence
router.get('/existing', async (req, res) => {
  try {
    const { dateKey, agenceId } = req.query;
    
    if (!dateKey || !agenceId) {
      return res.status(400).json({ message: 'DateKey et AgenceId sont requis' });
    }

    const query = `
      SELECT 
        k.DateKey, k.AgenceId, k.CategorieId,
        k.Nb_RelancesEnvoyees, k.Mt_RelancesEnvoyees,
        k.Nb_RelancesReglees, k.Mt_RelancesReglees,
        k.Nb_MisesEnDemeure_Envoyees, k.Mt_MisesEnDemeure_Envoyees,
        k.Nb_MisesEnDemeure_Reglees, k.Mt_MisesEnDemeure_Reglees,
        k.Nb_Dossiers_Juridiques, k.Mt_Dossiers_Juridiques,
        k.Nb_Coupures, k.Mt_Coupures,
        k.Encaissement_Journalier_Global,
        c.Libelle AS CategorieLibelle
      FROM dbo.FAIT_KPI_ADE k
      LEFT JOIN dbo.DIM_CATEGORIE c ON k.CategorieId = c.CategorieId
      WHERE k.DateKey = @dateKey AND k.AgenceId = @agenceId
      ORDER BY k.CategorieId
    `;

    const params = [
      { name: 'dateKey', type: TYPES.Int, value: parseInt(dateKey, 10) },
      { name: 'agenceId', type: TYPES.Int, value: parseInt(agenceId, 10) }
    ];

    const results = await db.query(query, params);
    res.json(results);
  } catch (err) {
    console.error('Erreur GET /kpi/existing:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des données existantes' });
  }
});

// GET /api/kpi/agences - liste des agences pour le formulaire (avec restriction par rôle)
router.get('/agences', (req, res) => {
  const role = (req.headers['x-role'] || '').toString();
  const userAgenceId = parseInt(req.headers['x-user-agence'], 10) || null;
  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur de connexion à la base', error: err.message });
    }

    const agences = [];
    const isAdmin = role === 'Administrateur';
    const query = isAdmin || !userAgenceId
      ? `
        SELECT AgenceId, Nom_Agence
        FROM dbo.DIM_AGENCE
        ORDER BY Nom_Agence
      `
      : `
        SELECT AgenceId, Nom_Agence
        FROM dbo.DIM_AGENCE
        WHERE AgenceId = @agenceId
        ORDER BY Nom_Agence
      `;

    const request = new Request(query, (err) => {
      connection.close();
      if (err) {
        return res.status(500).json({ message: 'Erreur lors de la lecture des agences', error: err.message });
      }
      res.json(agences);
    });

    if (!isAdmin && userAgenceId) {
      request.addParameter('agenceId', TYPES.Int, userAgenceId);
    }

    request.on('row', (columns) => {
      const row = {};
      columns.forEach((c) => { row[c.metadata.colName] = c.value; });
      agences.push(row);
    });

    connection.execSql(request);
  });

  connection.connect();
});

// GET /api/kpi/objectives - récupérer les objectifs pour une agence et période
router.get('/objectives', async (req, res) => {
  try {
    const { agenceId, year, month } = req.query;
    
    if (!agenceId || !year || !month) {
      return res.status(400).json({ message: 'AgenceId, year et month sont requis' });
    }

    const dateKey = parseInt(`${year}${month.toString().padStart(2, '0')}01`);
    const nextMonth = month === 12 ? 1 : parseInt(month) + 1;
    const nextYear = month === 12 ? parseInt(year) + 1 : parseInt(year);
    const nextMonthDateKey = parseInt(`${nextYear}${nextMonth.toString().padStart(2, '0')}01`);

    const query = `
      SELECT 
        o.AgenceId,
        o.Obj_Relances_Envoyees,
        o.Obj_MisesEnDemeure_Envoyees,
        o.Obj_Dossiers_Juridiques,
        o.Obj_Coupures,
        a.Nom_Agence
      FROM dbo.FAIT_KPI_ADE o
      LEFT JOIN dbo.DIM_AGENCE a ON o.AgenceId = a.AgenceId
      WHERE o.AgenceId = @agenceId 
        AND o.DateKey >= @dateKey 
        AND o.DateKey < @nextMonthDateKey
        AND (o.Obj_Relances_Envoyees IS NOT NULL 
             OR o.Obj_MisesEnDemeure_Envoyees IS NOT NULL 
             OR o.Obj_Dossiers_Juridiques IS NOT NULL 
             OR o.Obj_Coupures IS NOT NULL)
    `;

    const params = [
      { name: 'agenceId', type: TYPES.Int, value: parseInt(agenceId, 10) },
      { name: 'dateKey', type: TYPES.Int, value: dateKey },
      { name: 'nextMonthDateKey', type: TYPES.Int, value: nextMonthDateKey }
    ];

    const results = await db.query(query, params);
    res.json(results[0] || null);
  } catch (err) {
    console.error('Erreur GET /kpi/objectives:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des objectifs' });
  }
});

// GET /api/kpi/summary - récupérer le résumé des données d'une agence pour une date
router.get('/summary', async (req, res) => {
  try {
    const { agenceId, dateKey } = req.query;
    
    if (!agenceId || !dateKey) {
      return res.status(400).json({ message: 'AgenceId et dateKey sont requis' });
    }

    // Récupérer les données du jour
    const dailyQuery = `
      SELECT 
        SUM(k.Nb_RelancesEnvoyees) as Total_RelancesEnvoyees,
        SUM(k.Mt_RelancesEnvoyees) as Total_Mt_RelancesEnvoyees,
        SUM(k.Nb_RelancesReglees) as Total_RelancesReglees,
        SUM(k.Mt_RelancesReglees) as Total_Mt_RelancesReglees,
        SUM(k.Nb_MisesEnDemeure_Envoyees) as Total_MisesEnDemeureEnvoyees,
        SUM(k.Mt_MisesEnDemeure_Envoyees) as Total_Mt_MisesEnDemeureEnvoyees,
        SUM(k.Nb_MisesEnDemeure_Reglees) as Total_MisesEnDemeureReglees,
        SUM(k.Mt_MisesEnDemeure_Reglees) as Total_Mt_MisesEnDemeureReglees,
        SUM(k.Nb_Dossiers_Juridiques) as Total_DossiersJuridiques,
        SUM(k.Mt_Dossiers_Juridiques) as Total_Mt_DossiersJuridiques,
        SUM(k.Nb_Coupures) as Total_Coupures,
        SUM(k.Mt_Coupures) as Total_Mt_Coupures,
        SUM(k.Nb_Retablissements) as Total_Retablissements,
        SUM(k.Mt_Retablissements) as Total_Mt_Retablissements,
        SUM(k.Nb_Branchements) as Total_Branchements,
        SUM(k.Mt_Branchements) as Total_Mt_Branchements,
        SUM(k.Nb_Compteurs_Remplaces) as Total_CompteursRemplaces,
        SUM(k.Mt_Compteurs_Remplaces) as Total_Mt_CompteursRemplaces,
        SUM(k.Encaissement_Journalier_Global) as Total_EncaissementGlobal,
        a.Nom_Agence
      FROM dbo.FAIT_KPI_ADE k
      LEFT JOIN dbo.DIM_AGENCE a ON k.AgenceId = a.AgenceId
      WHERE k.AgenceId = @agenceId AND k.DateKey = @dateKey
      GROUP BY a.Nom_Agence
    `;

    // Récupérer les objectifs du mois
    const date = new Date(parseInt(dateKey.toString().substring(0,4)), parseInt(dateKey.toString().substring(4,6)) - 1, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const monthDateKey = parseInt(`${year}${month.toString().padStart(2, '0')}01`);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonthDateKey = parseInt(`${nextYear}${nextMonth.toString().padStart(2, '0')}01`);

    const objectivesQuery = `
      SELECT 
        o.Obj_Relances_Envoyees,
        o.Obj_MisesEnDemeure_Envoyees,
        o.Obj_Dossiers_Juridiques,
        o.Obj_Coupures
      FROM dbo.FAIT_KPI_ADE o
      WHERE o.AgenceId = @agenceId 
        AND o.DateKey >= @monthDateKey 
        AND o.DateKey < @nextMonthDateKey
        AND (o.Obj_Relances_Envoyees IS NOT NULL 
             OR o.Obj_MisesEnDemeure_Envoyees IS NOT NULL 
             OR o.Obj_Dossiers_Juridiques IS NOT NULL 
             OR o.Obj_Coupures IS NOT NULL)
    `;

    const dailyParams = [
      { name: 'agenceId', type: TYPES.Int, value: parseInt(agenceId, 10) },
      { name: 'dateKey', type: TYPES.Int, value: parseInt(dateKey, 10) }
    ];

    const objectivesParams = [
      { name: 'agenceId', type: TYPES.Int, value: parseInt(agenceId, 10) },
      { name: 'monthDateKey', type: TYPES.Int, value: monthDateKey },
      { name: 'nextMonthDateKey', type: TYPES.Int, value: nextMonthDateKey }
    ];

    const [dailyResults, objectivesResults] = await Promise.all([
      db.query(dailyQuery, dailyParams),
      db.query(objectivesQuery, objectivesParams)
    ]);

    res.json({
      daily: dailyResults[0] || null,
      objectives: objectivesResults[0] || null
    });
  } catch (err) {
    console.error('Erreur GET /kpi/summary:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération du résumé' });
  }
});

// GET /api/kpi/categories - liste des catégories pour le formulaire
router.get('/categories', (req, res) => {
  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur de connexion à la base', error: err.message });
    }

    const categories = [];
    const query = `
      SELECT CategorieId, CodeCategorie, Libelle
      FROM dbo.DIM_CATEGORIE
      ORDER BY CodeCategorie
    `;

    const request = new Request(query, (err) => {
      connection.close();
      if (err) {
        return res.status(500).json({ message: 'Erreur lors de la lecture des catégories', error: err.message });
      }
      res.json(categories);
    });

    request.on('row', (columns) => {
      const row = {};
      columns.forEach((c) => { row[c.metadata.colName] = c.value; });
      categories.push(row);
    });

    connection.execSql(request);
  });

  connection.connect();
});

module.exports = router;
