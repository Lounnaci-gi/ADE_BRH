const express = require('express');
const db = require('../utils/db');
const { TYPES } = db;

const router = express.Router();

// GET /api/kpi - liste des KPIs avec jointures (refactor db.query)
router.get('/', async (req, res) => {
  try {
    console.log('GET /kpi - Début de la requête');
    
    // D'abord vérifier si la table existe et a des données
    const countQuery = `SELECT COUNT(*) as count FROM dbo.FAIT_KPI_ADE`;
    const countResult = await db.query(countQuery, []);
    console.log('Nombre d\'enregistrements dans FAIT_KPI_ADE:', countResult[0]?.count || 0);
    
    if (countResult[0]?.count === 0) {
      console.log('Table FAIT_KPI_ADE vide, retour d\'un tableau vide');
      return res.json([]);
    }
    
    const query = `
      SELECT TOP 500
        k.DateKPI,
        k.AgenceId,
        k.CategorieId,
        a.Nom_Agence,
        c.Libelle AS CategorieLibelle
      FROM dbo.FAIT_KPI_ADE AS k
      LEFT JOIN dbo.DIM_AGENCE AS a ON k.AgenceId = a.AgenceId
      LEFT JOIN dbo.DIM_CATEGORIE AS c ON k.CategorieId = c.CategorieId
      ORDER BY k.DateKPI DESC, a.Nom_Agence, c.Libelle`;

    console.log('Exécution de la requête principale');
    const rows = await db.query(query, []);
    console.log('Résultats obtenus:', rows.length, 'lignes');
    res.json(rows || []);
  } catch (err) {
    console.error('Erreur GET /kpi:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ message: 'Erreur lors de la lecture des KPIs', error: err.message });
  }
});

// POST /api/kpi - créer/insérer un KPI (refactor db.query)
router.post('/', async (req, res) => {
  try {
    const {
      dateKey, agenceId, categorieId,
      encaissementJournalierGlobal, nbCoupures, mtCoupures,
      nbRetablissements, mtRetablissements,
      nbBranchements, mtBranchements,
      nbCompteursRemplaces, mtCompteursRemplaces,
      nbDossiersJuridiques, mtDossiersJuridiques,
      nbControles, mtControles,
      nbMisesEnDemeureEnvoyees, mtMisesEnDemeureEnvoyees,
      nbMisesEnDemeureReglees, mtMisesEnDemeureReglees,
      nbRelancesEnvoyees, mtRelancesEnvoyees,
      nbRelancesReglees, mtRelancesReglees,
      observation,
      objCoupures, objDossiersJuridiques, objMisesEnDemeureEnvoyees, objRelancesEnvoyees
    } = req.body || {};

    if (!dateKey || !agenceId || !categorieId) {
      return res.status(400).json({ message: 'DateKey, AgenceId et CategorieId sont requis' });
    }

    // Convertir dateKey (YYYYMMDD) en format DATE
    const year1 = parseInt(dateKey.toString().substring(0, 4));
    const month1 = parseInt(dateKey.toString().substring(4, 6));
    const day1 = parseInt(dateKey.toString().substring(6, 8));
    const dateValue = new Date(year1, month1 - 1, day1);

    // D'abord vérifier si l'enregistrement existe
    const checkQuery = `
      SELECT COUNT(*) as count 
      FROM dbo.FAIT_KPI_ADE 
      WHERE DateKPI = @dateKey AND AgenceId = @agenceId AND CategorieId = @categorieId
    `;
    
    console.log('Checking if record exists...');
    const checkResult = await db.query(checkQuery, [
      { name: 'dateKey', type: TYPES.Date, value: dateValue },
      { name: 'agenceId', type: TYPES.Int, value: parseInt(agenceId, 10) },
      { name: 'categorieId', type: TYPES.Int, value: parseInt(categorieId, 10) }
    ]);
    
    const exists = checkResult[0]?.count > 0;
    console.log('Record exists:', exists);
    
    let query;
    if (exists) {
      // UPDATE
      query = `
        UPDATE dbo.FAIT_KPI_ADE SET
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
          Nb_Retablissements = @nbRetablissements,
          Mt_Retablissements = @mtRetablissements,
          Nb_Branchements = @nbBranchements,
          Mt_Branchements = @mtBranchements,
          Nb_Compteurs_Remplaces = @nbCompteursRemplaces,
          Mt_Compteurs_Remplaces = @mtCompteursRemplaces,
          Nb_Controles = @nbControles,
          Mt_Controles = @mtControles,
          Encaissement_Journalier_Global = @encaissementJournalierGlobal,
          Observation = @observation,
          ModifiedAt = SYSUTCDATETIME()
        WHERE DateKPI = @dateKey AND AgenceId = @agenceId AND CategorieId = @categorieId
      `;
    } else {
      // INSERT
      query = `
        INSERT INTO dbo.FAIT_KPI_ADE (
          DateKPI, AgenceId, CategorieId,
          Nb_RelancesEnvoyees, Mt_RelancesEnvoyees,
          Nb_RelancesReglees, Mt_RelancesReglees,
          Nb_MisesEnDemeure_Envoyees, Mt_MisesEnDemeure_Envoyees,
          Nb_MisesEnDemeure_Reglees, Mt_MisesEnDemeure_Reglees,
          Nb_Dossiers_Juridiques, Mt_Dossiers_Juridiques,
          Nb_Coupures, Mt_Coupures,
          Nb_Retablissements, Mt_Retablissements,
          Nb_Branchements, Mt_Branchements,
          Nb_Compteurs_Remplaces, Mt_Compteurs_Remplaces,
          Nb_Controles, Mt_Controles,
          Encaissement_Journalier_Global, Observation
        ) VALUES (
          @dateKey, @agenceId, @categorieId,
          @nbRelancesEnvoyees, @mtRelancesEnvoyees,
          @nbRelancesReglees, @mtRelancesReglees,
          @nbMisesEnDemeureEnvoyees, @mtMisesEnDemeureEnvoyees,
          @nbMisesEnDemeureReglees, @mtMisesEnDemeureReglees,
          @nbDossiersJuridiques, @mtDossiersJuridiques,
          @nbCoupures, @mtCoupures,
          @nbRetablissements, @mtRetablissements,
          @nbBranchements, @mtBranchements,
          @nbCompteursRemplaces, @mtCompteursRemplaces,
          @nbControles, @mtControles,
          @encaissementJournalierGlobal, @observation
        )
      `;
    }

    const params = [
      { name: 'dateKey', type: TYPES.Date, value: dateValue },
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
      { name: 'nbRetablissements', type: TYPES.Int, value: parseInt(nbRetablissements || 0, 10) },
      { name: 'mtRetablissements', type: TYPES.Money, value: parseFloat(mtRetablissements || 0) },
      { name: 'nbBranchements', type: TYPES.Int, value: parseInt(nbBranchements || 0, 10) },
      { name: 'mtBranchements', type: TYPES.Money, value: parseFloat(mtBranchements || 0) },
      { name: 'nbCompteursRemplaces', type: TYPES.Int, value: parseInt(nbCompteursRemplaces || 0, 10) },
      { name: 'mtCompteursRemplaces', type: TYPES.Money, value: parseFloat(mtCompteursRemplaces || 0) },
      { name: 'nbControles', type: TYPES.Int, value: parseInt(nbControles || 0, 10) },
      { name: 'mtControles', type: TYPES.Money, value: parseFloat(mtControles || 0) },
      { name: 'encaissementJournalierGlobal', type: TYPES.Money, value: parseFloat(encaissementJournalierGlobal || 0) },
      { name: 'observation', type: TYPES.NVarChar, value: observation || '' }
    ];

    console.log('Attempting to upsert KPI with all fields:', { 
      dateKey, agenceId, categorieId,
      nbRelancesEnvoyees, mtRelancesEnvoyees,
      nbRelancesReglees, mtRelancesReglees,
      nbMisesEnDemeureEnvoyees, mtMisesEnDemeureEnvoyees,
      nbMisesEnDemeureReglees, mtMisesEnDemeureReglees,
      nbDossiersJuridiques, mtDossiersJuridiques,
      nbCoupures, mtCoupures,
      nbRetablissements, mtRetablissements,
      nbBranchements, mtBranchements,
      nbCompteursRemplaces, mtCompteursRemplaces,
      nbControles, mtControles,
      encaissementJournalierGlobal, observation
    });
    
    console.log('Executing', exists ? 'UPDATE' : 'INSERT', 'query with params:', params.length, 'parameters');
    const result = await db.query(query, params);
    console.log('Query result:', result);
    
    res.status(200).json({ message: 'KPI sauvegardé avec succès' });
  } catch (err) {
    console.error('Erreur POST /kpi:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ message: 'Erreur lors de la sauvegarde du KPI', error: err.message });
  }
});

// GET /api/kpi/existing - récupérer les données KPI existantes pour une date/agence
router.get('/existing', async (req, res) => {
  try {
    const { dateKey, agenceId } = req.query;
    
    console.log('GET /kpi/existing - Paramètres:', { dateKey, agenceId });
    
    if (!dateKey || !agenceId) {
      return res.status(400).json({ message: 'DateKey et AgenceId sont requis' });
    }

    // D'abord vérifier si la table existe et a des données
    const countQuery = `SELECT COUNT(*) as count FROM dbo.FAIT_KPI_ADE WHERE DateKPI = @dateKey AND AgenceId = @agenceId`;
    // Convertir dateKey (YYYYMMDD) en format DATE
    const year1 = parseInt(dateKey.toString().substring(0, 4));
    const month1 = parseInt(dateKey.toString().substring(4, 6));
    const day1 = parseInt(dateKey.toString().substring(6, 8));
    const dateValue = new Date(year1, month1 - 1, day1);
    
    const countParams = [
      { name: 'dateKey', type: TYPES.Date, value: dateValue },
      { name: 'agenceId', type: TYPES.Int, value: parseInt(agenceId, 10) }
    ];
    
    console.log('Vérification du nombre d\'enregistrements...');
    const countResult = await db.query(countQuery, countParams);
    console.log('Nombre d\'enregistrements trouvés:', countResult[0]?.count || 0);
    
    if (countResult[0]?.count === 0) {
      console.log('Aucun enregistrement trouvé, retour d\'un tableau vide');
      return res.json([]);
    }

    const query = `
      SELECT 
        k.DateKPI, k.AgenceId, k.CategorieId,
        k.Encaissement_Journalier_Global,
        k.Nb_RelancesEnvoyees, k.Mt_RelancesEnvoyees,
        k.Nb_RelancesReglees, k.Mt_RelancesReglees,
        k.Nb_MisesEnDemeure_Envoyees, k.Mt_MisesEnDemeure_Envoyees,
        k.Nb_MisesEnDemeure_Reglees, k.Mt_MisesEnDemeure_Reglees,
        k.Nb_Dossiers_Juridiques, k.Mt_Dossiers_Juridiques,
        k.Nb_Coupures, k.Mt_Coupures,
        k.Nb_Retablissements, k.Mt_Retablissements,
        k.Nb_Branchements, k.Mt_Branchements,
        k.Nb_Compteurs_Remplaces, k.Mt_Compteurs_Remplaces,
        k.Nb_Controles, k.Mt_Controles,
        k.Observation,
        c.Libelle AS CategorieLibelle
      FROM dbo.FAIT_KPI_ADE k
      LEFT JOIN dbo.DIM_CATEGORIE c ON k.CategorieId = c.CategorieId
      WHERE k.DateKPI = @dateKey AND k.AgenceId = @agenceId
      ORDER BY k.CategorieId
    `;

    const params = [
      { name: 'dateKey', type: TYPES.Date, value: dateValue },
      { name: 'agenceId', type: TYPES.Int, value: parseInt(agenceId, 10) }
    ];

    console.log('Exécution de la requête principale...');
    const results = await db.query(query, params);
    console.log('Résultats obtenus:', results.length, 'lignes');
    res.json(results);
  } catch (err) {
    console.error('Erreur GET /kpi/existing:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ message: 'Erreur lors de la récupération des données existantes', error: err.message });
  }
});

// GET /api/kpi/agences - liste des agences pour le formulaire (avec restriction par rôle)
router.get('/agences', async (req, res) => {
  try {
  const role = (req.headers['x-role'] || '').toString();
  const userAgenceId = parseInt(req.headers['x-user-agence'], 10) || null;
    
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

    const params = [];
    if (!isAdmin && userAgenceId) {
      params.push({ name: 'agenceId', type: TYPES.Int, value: userAgenceId });
    }

    const results = await db.query(query, params);
    res.json(results || []);
  } catch (err) {
    console.error('Erreur GET /kpi/agences:', err);
    res.status(500).json({ message: 'Erreur lors de la lecture des agences', error: err.message });
  }
});

// GET /api/kpi/objectives - récupérer les objectifs pour une agence et période (optionnelle)
router.get('/objectives', async (req, res) => {
  try {
    const { agenceId, year, month } = req.query;
    
    if (!agenceId) {
      return res.status(400).json({ message: 'AgenceId est requis' });
    }

    let query, params;

    if (year && month) {
      // Récupérer les objectifs pour une période spécifique
      query = `
        SELECT 
          o.ObjectifId,
          o.Titre,
          o.Description,
          o.DateDebut,
          o.DateFin,
          o.FK_Agence,
          o.Obj_Encaissement,
          o.Obj_Relances,
          o.Obj_MisesEnDemeure,
          o.Obj_Dossiers_Juridiques,
          o.Obj_Coupures,
          o.Obj_Controles,
          o.Obj_Compteurs_Remplaces,
          a.Nom_Agence
        FROM dbo.DIM_OBJECTIF o
        LEFT JOIN dbo.DIM_AGENCE a ON o.FK_Agence = a.AgenceId
        WHERE o.FK_Agence = @agenceId 
          AND o.DateDebut <= @dateValue 
          AND o.DateFin >= @dateValue
          AND o.IsActive = 1
      `;

      // Convertir year/month en date pour la comparaison
      const year1 = parseInt(year, 10);
      const month1 = parseInt(month, 10);
      const dateValue = new Date(year1, month1 - 1, 1); // Premier jour du mois
      
      params = [
        { name: 'agenceId', type: TYPES.Int, value: parseInt(agenceId, 10) },
        { name: 'dateValue', type: TYPES.Date, value: dateValue }
      ];

      const results = await db.query(query, params);
      res.json(results[0] || null);
    } else {
      // Récupérer tous les objectifs de l'agence
      query = `
        SELECT 
          o.ObjectifId,
          o.Titre,
          o.Description,
          o.DateDebut,
          o.DateFin,
          o.FK_Agence,
          o.Obj_Encaissement,
          o.Obj_Relances,
          o.Obj_MisesEnDemeure,
          o.Obj_Dossiers_Juridiques,
          o.Obj_Coupures,
          o.Obj_Controles,
          o.Obj_Compteurs_Remplaces,
          a.Nom_Agence
        FROM dbo.DIM_OBJECTIF o
        LEFT JOIN dbo.DIM_AGENCE a ON o.FK_Agence = a.AgenceId
        WHERE o.FK_Agence = @agenceId 
          AND o.IsActive = 1
        ORDER BY o.DateDebut DESC
      `;
      
      params = [
        { name: 'agenceId', type: TYPES.Int, value: parseInt(agenceId, 10) }
      ];

      const results = await db.query(query, params);
      res.json(results || []);
    }
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
        SUM(k.Encaissement_Journalier_Global) as Total_EncaissementGlobal,
        a.Nom_Agence
      FROM dbo.FAIT_KPI_ADE k
      LEFT JOIN dbo.DIM_AGENCE a ON k.AgenceId = a.AgenceId
      WHERE k.AgenceId = @agenceId AND k.DateKPI = @dateKey
      GROUP BY a.Nom_Agence
    `;

    // Récupérer les objectifs du mois
    const date = new Date(parseInt(dateKey.toString().substring(0,4)), parseInt(dateKey.toString().substring(4,6)) - 1, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const objectivesQuery = `
      SELECT 
        o.Obj_Relances,
        o.Obj_MisesEnDemeure,
        o.Obj_Dossiers_Juridiques,
        o.Obj_Coupures
      FROM dbo.DIM_OBJECTIF o
      WHERE o.FK_Agence = @agenceId 
        AND o.DateDebut <= @dateValue 
        AND o.DateFin >= @dateValue
        AND o.IsActive = 1
    `;

    // Convertir dateKey (YYYYMMDD) en format DATE
    const year1 = parseInt(dateKey.toString().substring(0, 4));
    const month1 = parseInt(dateKey.toString().substring(4, 6));
    const day1 = parseInt(dateKey.toString().substring(6, 8));
    const dateValue = new Date(year1, month1 - 1, day1);
    
    const dailyParams = [
      { name: 'agenceId', type: TYPES.Int, value: parseInt(agenceId, 10) },
      { name: 'dateKey', type: TYPES.Date, value: dateValue }
    ];

    const objectivesParams = [
      { name: 'agenceId', type: TYPES.Int, value: parseInt(agenceId, 10) },
      { name: 'dateValue', type: TYPES.Date, value: dateValue }
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
router.get('/categories', async (req, res) => {
  try {
    const query = `
      SELECT CategorieId, CodeCategorie, Libelle
      FROM dbo.DIM_CATEGORIE
      ORDER BY CodeCategorie
    `;

    const results = await db.query(query, []);
    res.json(results || []);
  } catch (err) {
    console.error('Erreur GET /kpi/categories:', err);
    res.status(500).json({ message: 'Erreur lors de la lecture des catégories', error: err.message });
  }
});

module.exports = router;
