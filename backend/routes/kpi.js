const express = require('express');
const db = require('../utils/db');
const { TYPES } = db;
const { convertDateKeyToSQLServer, isValidDateKey, roundAmount, parseDateStringForSQLServer } = require('../utils/dateUtils');

const router = express.Router();

// GET /api/kpi - liste des KPIs avec jointures (refactor db.query)
router.get('/', async (req, res) => {
  try {
    // D'abord vérifier si la table existe et a des données
    const countQuery = `SELECT COUNT(*) as count FROM dbo.FAIT_KPI_ADE`;
    const countResult = await db.query(countQuery, []);
    
    if (countResult[0]?.count === 0) {
      return res.json([]);
    }
    
    const query = `
      SELECT TOP 500
        k.DateKPI,
        CONVERT(INT, CONVERT(VARCHAR(8), k.DateKPI, 112)) AS DateKey,
        k.AgenceId,
        k.CategorieId,
        a.Nom_Agence,
        c.Libelle AS CategorieLibelle
      FROM dbo.FAIT_KPI_ADE AS k
      LEFT JOIN dbo.DIM_AGENCE AS a ON k.AgenceId = a.AgenceId
      LEFT JOIN dbo.DIM_CATEGORIE AS c ON k.CategorieId = c.CategorieId
      ORDER BY k.DateKPI DESC, a.Nom_Agence, c.Libelle`;

    const rows = await db.query(query, []);
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
      nbBranchements,
      nbCompteursRemplaces, mtCompteursRemplaces,
      nbDossiersJuridiques, mtDossiersJuridiques,
      nbControles,
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

    // Validation des types de données
    const agenceIdInt = parseInt(agenceId, 10);
    const categorieIdInt = parseInt(categorieId, 10);
    
    if (isNaN(agenceIdInt) || agenceIdInt <= 0) {
      return res.status(400).json({ message: 'AgenceId doit être un nombre entier positif' });
    }
    
    if (isNaN(categorieIdInt) || categorieIdInt <= 0) {
      return res.status(400).json({ message: 'CategorieId doit être un nombre entier positif' });
    }

    // Validation du format de dateKey (YYYYMMDD)
    if (!/^\d{8}$/.test(dateKey.toString())) {
      return res.status(400).json({ message: 'DateKey doit être au format YYYYMMDD (8 chiffres)' });
    }

    // Convertir dateKey (YYYYMMDD) en format DATE sans décalage de fuseau horaire
    const year1 = parseInt(dateKey.toString().substring(0, 4));
    const month1 = parseInt(dateKey.toString().substring(4, 6));
    const day1 = parseInt(dateKey.toString().substring(6, 8));
    const dateValue = parseDateStringForSQLServer(`${year1}-${month1.toString().padStart(2, '0')}-${day1.toString().padStart(2, '0')}`);

    // D'abord vérifier si l'enregistrement existe
    const checkQuery = `
      SELECT COUNT(*) as count 
      FROM dbo.FAIT_KPI_ADE 
      WHERE DateKPI = @dateKey AND AgenceId = @agenceId AND CategorieId = @categorieId
    `;
    
    const checkResult = await db.query(checkQuery, [
      { name: 'dateKey', type: TYPES.Date, value: dateValue },
      { name: 'agenceId', type: TYPES.Int, value: agenceIdInt },
      { name: 'categorieId', type: TYPES.Int, value: categorieIdInt }
    ]);
    
    const exists = checkResult[0]?.count > 0;
    
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
          Nb_Compteurs_Remplaces = @nbCompteursRemplaces,
          Nb_Controles = @nbControles,
          Encaissement_Journalier_Global = @encaissementJournalierGlobal,
          Observation = @observation,
          ModifiedAt = SYSUTCDATETIME()
        WHERE DateKPI = @dateKey AND AgenceId = @agenceId AND CategorieId = @categorieId
      `;
    } else {
      // INSERT
      query = `
      INSERT INTO dbo.FAIT_KPI_ADE (
          AgenceId, DateKPI, CategorieId,
        Nb_RelancesEnvoyees, Mt_RelancesEnvoyees,
        Nb_RelancesReglees, Mt_RelancesReglees,
        Nb_MisesEnDemeure_Envoyees, Mt_MisesEnDemeure_Envoyees,
          Nb_MisesEnDemeure_Reglees, Mt_MisesEnDemeure_Reglees,
        Nb_Dossiers_Juridiques, Mt_Dossiers_Juridiques,
        Nb_Coupures, Mt_Coupures,
          Nb_Retablissements, Mt_Retablissements,
          Nb_Branchements,
          Nb_Compteurs_Remplaces,
          Nb_Controles,
          Encaissement_Journalier_Global, Observation
      ) VALUES (
        @agenceId, @dateKey, @categorieId,
        @nbRelancesEnvoyees, @mtRelancesEnvoyees,
        @nbRelancesReglees, @mtRelancesReglees,
        @nbMisesEnDemeureEnvoyees, @mtMisesEnDemeureEnvoyees,
          @nbMisesEnDemeureReglees, @mtMisesEnDemeureReglees,
        @nbDossiersJuridiques, @mtDossiersJuridiques,
        @nbCoupures, @mtCoupures,
          @nbRetablissements, @mtRetablissements,
          @nbBranchements,
          @nbCompteursRemplaces,
          @nbControles,
          @encaissementJournalierGlobal, @observation
        )
      `;
    }

    const params = [
      { name: 'dateKey', type: TYPES.Date, value: dateValue },
      { name: 'agenceId', type: TYPES.Int, value: agenceIdInt },
      { name: 'categorieId', type: TYPES.Int, value: categorieIdInt },
      { name: 'nbRelancesEnvoyees', type: TYPES.Int, value: parseInt(nbRelancesEnvoyees || 0, 10) },
      { name: 'mtRelancesEnvoyees', type: TYPES.Money, value: roundAmount(mtRelancesEnvoyees) },
      { name: 'nbRelancesReglees', type: TYPES.Int, value: parseInt(nbRelancesReglees || 0, 10) },
      { name: 'mtRelancesReglees', type: TYPES.Money, value: roundAmount(mtRelancesReglees) },
      { name: 'nbMisesEnDemeureEnvoyees', type: TYPES.Int, value: parseInt(nbMisesEnDemeureEnvoyees || 0, 10) },
      { name: 'mtMisesEnDemeureEnvoyees', type: TYPES.Money, value: roundAmount(mtMisesEnDemeureEnvoyees) },
      { name: 'nbMisesEnDemeureReglees', type: TYPES.Int, value: parseInt(nbMisesEnDemeureReglees || 0, 10) },
      { name: 'mtMisesEnDemeureReglees', type: TYPES.Money, value: roundAmount(mtMisesEnDemeureReglees) },
      { name: 'nbDossiersJuridiques', type: TYPES.Int, value: parseInt(nbDossiersJuridiques || 0, 10) },
      { name: 'mtDossiersJuridiques', type: TYPES.Money, value: roundAmount(mtDossiersJuridiques) },
      { name: 'nbCoupures', type: TYPES.Int, value: parseInt(nbCoupures || 0, 10) },
      { name: 'mtCoupures', type: TYPES.Money, value: roundAmount(mtCoupures) },
      { name: 'nbRetablissements', type: TYPES.Int, value: parseInt(nbRetablissements || 0, 10) },
      { name: 'mtRetablissements', type: TYPES.Money, value: roundAmount(mtRetablissements) },
      { name: 'nbBranchements', type: TYPES.Int, value: parseInt(nbBranchements || 0, 10) },
      { name: 'nbCompteursRemplaces', type: TYPES.Int, value: parseInt(nbCompteursRemplaces || 0, 10) },
      { name: 'nbControles', type: TYPES.Int, value: parseInt(nbControles || 0, 10) },
      { name: 'encaissementJournalierGlobal', type: TYPES.Money, value: roundAmount(encaissementJournalierGlobal) },
      { name: 'observation', type: TYPES.NVarChar, value: observation || '' }
    ];

    const result = await db.query(query, params);
    
    // ✅ VÉRIFIER CE QUI EST RÉELLEMENT STOCKÉ DANS LA BDD
    const verifyQuery = `
      SELECT TOP 1 DateKPI, AgenceId, CategorieId, CreatedAt 
      FROM dbo.FAIT_KPI_ADE 
      WHERE AgenceId = @agenceId AND CategorieId = @categorieId 
      ORDER BY CreatedAt DESC
    `;
    
    const verifyParams = [
      { name: 'agenceId', type: TYPES.Int, value: agenceIdInt },
      { name: 'categorieId', type: TYPES.Int, value: categorieIdInt }
    ];
    
    const verifyResult = await db.query(verifyQuery, verifyParams);
    
    console.log('✅ KPI sauvegardé avec succès:', {
      dateKey: dateValue,
      dateKeyISO: dateValue.toISOString(),
      dateKeyLocal: dateValue.toLocaleDateString('fr-FR'),
      agenceId: agenceIdInt,
      categorieId: categorieIdInt,
      operation: exists ? 'UPDATE' : 'INSERT'
    });
    
    if (verifyResult && verifyResult.length > 0) {
      console.log('🔍 VÉRIFICATION BDD - Date réellement stockée:', {
        DateKPI: verifyResult[0].DateKPI,
        AgenceId: verifyResult[0].AgenceId,
        CategorieId: verifyResult[0].CategorieId,
        CreatedAt: verifyResult[0].CreatedAt
      });
    }
    
    res.status(200).json({ 
      message: 'KPI sauvegardé avec succès',
      operation: exists ? 'updated' : 'created',
      dateKey: dateValue,
      agenceId: agenceIdInt,
      categorieId: categorieIdInt
    });
  } catch (err) {
    console.error('❌ Erreur POST /kpi:', err);
    console.error('📊 Détails de la requête:', {
      dateKey: dateValue || 'undefined',
      agenceId: agenceIdInt,
      categorieId: categorieIdInt,
      body: req.body
    });
    console.error('🔍 Stack trace:', err.stack);
    
    // Gestion d'erreur spécifique selon le type
    let errorMessage = 'Erreur lors de la sauvegarde du KPI';
    let statusCode = 500;
    
    if (err.message && err.message.includes('constraint')) {
      errorMessage = 'Violation de contrainte de base de données. Vérifiez que tous les champs requis sont remplis.';
      statusCode = 400;
    } else if (err.message && err.message.includes('foreign key')) {
      errorMessage = 'Référence invalide. Vérifiez que l\'agence et la catégorie existent.';
      statusCode = 400;
    } else if (err.message && err.message.includes('conversion')) {
      errorMessage = 'Erreur de conversion de données. Vérifiez le format des valeurs numériques.';
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      message: errorMessage, 
      error: err.message,
      details: {
        dateKey: dateValue,
        agenceId: agenceIdInt,
        categorieId: categorieIdInt
      }
    });
  }
});

// GET /api/kpi/existing - récupérer les données KPI existantes pour une date/agence
router.get('/existing', async (req, res) => {
  try {
    const { dateKey, agenceId } = req.query;
    
    if (!dateKey || !agenceId) {
      return res.status(400).json({ message: 'DateKey et AgenceId sont requis' });
    }

    // D'abord vérifier si la table existe et a des données
    const countQuery = `SELECT COUNT(*) as count FROM dbo.FAIT_KPI_ADE WHERE DateKPI = @dateKey AND AgenceId = @agenceId`;
    // Convertir dateKey (YYYYMMDD) en format DATE sans décalage de fuseau horaire
    const year1 = parseInt(dateKey.toString().substring(0, 4));
    const month1 = parseInt(dateKey.toString().substring(4, 6));
    const day1 = parseInt(dateKey.toString().substring(6, 8));
    const dateValue = parseDateStringForSQLServer(`${year1}-${month1.toString().padStart(2, '0')}-${day1.toString().padStart(2, '0')}`);
    
    const countParams = [
      { name: 'dateKey', type: TYPES.Date, value: dateValue },
      { name: 'agenceId', type: TYPES.Int, value: parseInt(agenceId, 10) }
    ];
    
    const countResult = await db.query(countQuery, countParams);
    
    if (countResult[0]?.count === 0) {
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
        k.Nb_Branchements,
        k.Nb_Compteurs_Remplaces,
        k.Nb_Controles,
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

    const results = await db.query(query, params);
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

    // Validation du format de dateKey
    if (!isValidDateKey(parseInt(dateKey))) {
      return res.status(400).json({ 
        message: 'Format de dateKey invalide. Attendu: YYYYMMDD',
        details: { dateKey }
      });
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
        SUM(k.Nb_Controles) as Total_Controles,
        SUM(k.Nb_Compteurs_Remplaces) as Total_CompteursRemplaces,
        MAX(k.Encaissement_Journalier_Global) as Total_EncaissementGlobal,
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
        o.Obj_Encaissement,
        o.Obj_Relances,
        o.Obj_MisesEnDemeure,
        o.Obj_Dossiers_Juridiques,
        o.Obj_Coupures,
        o.Obj_Controles,
        o.Obj_Compteurs_Remplaces
      FROM dbo.DIM_OBJECTIF o
      WHERE o.FK_Agence = @agenceId 
        AND o.DateDebut <= @dateValue 
        AND o.DateFin >= @dateValue
        AND o.IsActive = 1
    `;

    // Convertir dateKey (YYYYMMDD) en format DATE sans décalage de fuseau horaire
    const dateValue = convertDateKeyToSQLServer(parseInt(dateKey));
    
    const dailyParams = [
      { name: 'agenceId', type: TYPES.Int, value: parseInt(agenceId, 10) },
      { name: 'dateKey', type: TYPES.Date, value: dateValue }
    ];

    const objectivesParams = [
      { name: 'agenceId', type: TYPES.Int, value: parseInt(agenceId, 10) },
      { name: 'dateValue', type: TYPES.Date, value: dateValue }
    ];

    console.log('🔍 DEBUG /kpi/summary - Paramètres:', { agenceId, dateKey, dateValue });
    console.log('🔍 DEBUG /kpi/summary - Daily params:', dailyParams);
    console.log('🔍 DEBUG /kpi/summary - Objectives params:', objectivesParams);

    const [dailyResults, objectivesResults] = await Promise.all([
      db.query(dailyQuery, dailyParams),
      db.query(objectivesQuery, objectivesParams)
    ]);

    console.log('🔍 DEBUG /kpi/summary - Daily results:', dailyResults);
    console.log('🔍 DEBUG /kpi/summary - Objectives results:', objectivesResults);

    const response = {
      daily: dailyResults[0] || null,
      objectives: objectivesResults[0] || null
    };

    console.log('🔍 DEBUG /kpi/summary - Final response:', response);
    res.json(response);
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
