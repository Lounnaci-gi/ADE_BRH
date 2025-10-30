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
        SELECT a.AgenceId, a.Nom_Agence, c.Nom_Centre
        FROM dbo.DIM_AGENCE a
        LEFT JOIN dbo.DIM_CENTRE c ON a.FK_Centre = c.CentreId
        ORDER BY a.Nom_Agence
      `
      : `
        SELECT a.AgenceId, a.Nom_Agence, c.Nom_Centre
        FROM dbo.DIM_AGENCE a
        LEFT JOIN dbo.DIM_CENTRE c ON a.FK_Centre = c.CentreId
        WHERE a.AgenceId = @agenceId
        ORDER BY a.Nom_Agence
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

    // Récupérer les données du jour avec calcul du taux d'encaissement
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
        a.Nom_Agence,
        c.Nom_Centre,
        -- Calcul du taux d'encaissement basé sur l'objectif d'encaissement de l'agence
        CASE 
          WHEN o.Obj_Encaissement > 0 
          THEN ROUND((MAX(k.Encaissement_Journalier_Global) * 100.0) / o.Obj_Encaissement, 2)
          ELSE 0 
        END as TauxEncaissementGlobal
      FROM dbo.FAIT_KPI_ADE k
      LEFT JOIN dbo.DIM_AGENCE a ON k.AgenceId = a.AgenceId
      LEFT JOIN dbo.DIM_CENTRE c ON a.FK_Centre = c.CentreId
      LEFT JOIN dbo.DIM_OBJECTIF o ON a.AgenceId = o.FK_Agence 
        AND o.DateDebut <= @dateKey 
        AND o.DateFin >= @dateKey 
        AND o.IsActive = 1
      WHERE k.AgenceId = @agenceId AND k.DateKPI = @dateKey
      GROUP BY a.Nom_Agence, c.Nom_Centre, o.Obj_Encaissement
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

// GET /api/kpi/global-summary - récupérer le résumé global avec les taux pour toutes les agences
router.get('/global-summary', async (req, res) => {
  try {
    const { dateKey } = req.query;
    
    if (!dateKey) {
      return res.status(400).json({ message: 'dateKey est requis' });
    }

    // Validation du format de dateKey
    if (!isValidDateKey(parseInt(dateKey))) {
      return res.status(400).json({ 
        message: 'Format de dateKey invalide. Attendu: YYYYMMDD',
        details: { dateKey }
      });
    }

    // Convertir dateKey (YYYYMMDD) en format DATE
    const dateValue = convertDateKeyToSQLServer(parseInt(dateKey));

    // Récupérer les totaux globaux avec les objectifs
    // NOUVELLE LOGIQUE : Séparer les réalisations (données journalières) et les objectifs (toutes agences)
    const globalQuery = `
      WITH Realisations AS (
        -- Réalisations : seulement les agences avec données journalières
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
          SUM(k.Encaissement_Journalier_Global) as Total_EncaissementGlobal,
          COUNT(DISTINCT k.AgenceId) as Agences_Avec_Donnees
        FROM dbo.FAIT_KPI_ADE k
        WHERE k.DateKPI = @dateKey
      ),
      Objectifs AS (
        -- Objectifs : TOUTES les agences avec objectifs actifs
        SELECT 
          SUM(o.Obj_Relances) as Total_Obj_Relances,
          SUM(o.Obj_MisesEnDemeure) as Total_Obj_MisesEnDemeure,
          SUM(o.Obj_Dossiers_Juridiques) as Total_Obj_DossiersJuridiques,
          SUM(o.Obj_Coupures) as Total_Obj_Coupures,
          SUM(o.Obj_Controles) as Total_Obj_Controles,
          SUM(o.Obj_Compteurs_Remplaces) as Total_Obj_CompteursRemplaces,
          SUM(o.Obj_Encaissement) as Total_Obj_Encaissement,
          COUNT(DISTINCT o.FK_Agence) as Total_Agences
        FROM dbo.DIM_OBJECTIF o
        WHERE o.DateDebut <= @dateKey 
          AND o.DateFin >= @dateKey 
          AND o.IsActive = 1
      )
      SELECT 
        -- Réalisations (agences avec données journalières)
        r.Total_RelancesEnvoyees,
        r.Total_Mt_RelancesEnvoyees,
        r.Total_RelancesReglees,
        r.Total_Mt_RelancesReglees,
        r.Total_MisesEnDemeureEnvoyees,
        r.Total_Mt_MisesEnDemeureEnvoyees,
        r.Total_MisesEnDemeureReglees,
        r.Total_Mt_MisesEnDemeureReglees,
        r.Total_DossiersJuridiques,
        r.Total_Mt_DossiersJuridiques,
        r.Total_Coupures,
        r.Total_Mt_Coupures,
        r.Total_Retablissements,
        r.Total_Mt_Retablissements,
        r.Total_Controles,
        r.Total_CompteursRemplaces,
        r.Total_EncaissementGlobal,
        
        -- Objectifs (TOUTES les agences)
        o.Total_Obj_Relances,
        o.Total_Obj_MisesEnDemeure,
        o.Total_Obj_DossiersJuridiques,
        o.Total_Obj_Coupures,
        o.Total_Obj_Controles,
        o.Total_Obj_CompteursRemplaces,
        o.Total_Obj_Encaissement,
        
        -- Calcul des taux basés sur les objectifs de TOUTES les agences
        CASE 
          WHEN o.Total_Obj_Relances > 0 
          THEN ROUND((r.Total_RelancesEnvoyees * 100.0) / o.Total_Obj_Relances, 2)
          ELSE 0 
        END as Taux_Relances,
        
        CASE 
          WHEN o.Total_Obj_MisesEnDemeure > 0 
          THEN ROUND((r.Total_MisesEnDemeureEnvoyees * 100.0) / o.Total_Obj_MisesEnDemeure, 2)
          ELSE 0 
        END as Taux_MisesEnDemeure,
        
        CASE 
          WHEN o.Total_Obj_DossiersJuridiques > 0 
          THEN ROUND((r.Total_DossiersJuridiques * 100.0) / o.Total_Obj_DossiersJuridiques, 2)
          ELSE 0 
        END as Taux_DossiersJuridiques,
        
        CASE 
          WHEN o.Total_Obj_Coupures > 0 
          THEN ROUND((r.Total_Coupures * 100.0) / o.Total_Obj_Coupures, 2)
          ELSE 0 
        END as Taux_Coupures,
        
        CASE 
          WHEN o.Total_Obj_Controles > 0 
          THEN ROUND((r.Total_Controles * 100.0) / o.Total_Obj_Controles, 2)
          ELSE 0 
        END as Taux_Controles,
        
        CASE 
          WHEN o.Total_Obj_CompteursRemplaces > 0 
          THEN ROUND((r.Total_CompteursRemplaces * 100.0) / o.Total_Obj_CompteursRemplaces, 2)
          ELSE 0 
        END as Taux_CompteursRemplaces,
        
        CASE 
          WHEN o.Total_Obj_Encaissement > 0 
          THEN ROUND((r.Total_EncaissementGlobal * 100.0) / o.Total_Obj_Encaissement, 2)
          ELSE 0 
        END as Taux_Encaissement,
        
        o.Total_Agences,
        r.Agences_Avec_Donnees
        
      FROM Realisations r
      CROSS JOIN Objectifs o
    `;

    const params = [
      { name: 'dateKey', type: TYPES.Date, value: dateValue }
    ];

    console.log('🔍 DEBUG /kpi/global-summary - Paramètres:', { dateKey, dateValue });

    const results = await db.query(globalQuery, params);
    
    console.log('🔍 DEBUG /kpi/global-summary - Résultats:', results);

    const response = {
      global: results[0] || null,
      dateKey: parseInt(dateKey),
      dateValue: dateValue
    };

    console.log('🔍 DEBUG /kpi/global-summary - Réponse finale:', response);
    res.json(response);
  } catch (err) {
    console.error('Erreur GET /kpi/global-summary:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ message: 'Erreur lors de la récupération du résumé global', error: err.message });
  }
});

// GET /api/kpi/detailed-data - récupérer les données détaillées par agence et période
router.get('/detailed-data', async (req, res) => {
  try {
    const { agenceId, startDate, endDate } = req.query;
    
    if (!agenceId || !startDate || !endDate) {
      return res.status(400).json({ message: 'AgenceId, startDate et endDate sont requis' });
    }

    // Validation des dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ message: 'Format de date invalide' });
    }
    
    if (startDateObj > endDateObj) {
      return res.status(400).json({ message: 'La date de début doit être antérieure à la date de fin' });
    }

    // Requête pour récupérer les données détaillées par jour avec agrégation et objectifs
    const detailedQuery = `
      SELECT 
        k.DateKPI,
        -- Agrégation des réalisations (somme pour chaque date)
        SUM(k.Nb_RelancesEnvoyees) as Nb_RelancesEnvoyees,
        SUM(k.Mt_RelancesEnvoyees) as Mt_RelancesEnvoyees,
        SUM(k.Nb_RelancesReglees) as Nb_RelancesReglees,
        SUM(k.Mt_RelancesReglees) as Mt_RelancesReglees,
        SUM(k.Nb_MisesEnDemeure_Envoyees) as Nb_MisesEnDemeure_Envoyees,
        SUM(k.Mt_MisesEnDemeure_Envoyees) as Mt_MisesEnDemeure_Envoyees,
        SUM(k.Nb_MisesEnDemeure_Reglees) as Nb_MisesEnDemeure_Reglees,
        SUM(k.Mt_MisesEnDemeure_Reglees) as Mt_MisesEnDemeure_Reglees,
        SUM(k.Nb_Dossiers_Juridiques) as Nb_Dossiers_Juridiques,
        SUM(k.Mt_Dossiers_Juridiques) as Mt_Dossiers_Juridiques,
        SUM(k.Nb_Coupures) as Nb_Coupures,
        SUM(k.Mt_Coupures) as Mt_Coupures,
        SUM(k.Nb_Retablissements) as Nb_Retablissements,
        SUM(k.Mt_Retablissements) as Mt_Retablissements,
        SUM(k.Nb_Compteurs_Remplaces) as Nb_Compteurs_Remplaces,
        SUM(k.Encaissement_Journalier_Global) as Encaissement_Journalier_Global,
        -- Observation (première occurrence)
        MIN(k.Observation) as Observation,
        -- Informations agence (première occurrence)
        MIN(a.Nom_Agence) as Nom_Agence,
        MIN(c.Nom_Centre) as Nom_Centre,
        -- Objectifs (première occurrence - ils sont identiques pour une même date)
        MIN(o.Obj_Encaissement) as Obj_Encaissement,
        MIN(o.Obj_Relances) as Obj_Relances,
        MIN(o.Obj_MisesEnDemeure) as Obj_MisesEnDemeure,
        MIN(o.Obj_Dossiers_Juridiques) as Obj_Dossiers_Juridiques,
        MIN(o.Obj_Coupures) as Obj_Coupures,
        MIN(o.Obj_Controles) as Obj_Controles,
        MIN(o.Obj_Compteurs_Remplaces) as Obj_Compteurs_Remplaces
      FROM dbo.FAIT_KPI_ADE k
      LEFT JOIN dbo.DIM_AGENCE a ON k.AgenceId = a.AgenceId
      LEFT JOIN dbo.DIM_CENTRE c ON a.FK_Centre = c.CentreId
      LEFT JOIN dbo.DIM_OBJECTIF o ON k.AgenceId = o.FK_Agence 
        AND o.DateDebut <= k.DateKPI 
        AND o.DateFin >= k.DateKPI 
        AND o.IsActive = 1
      WHERE k.AgenceId = @agenceId 
        AND k.DateKPI >= @startDate 
        AND k.DateKPI <= @endDate
      GROUP BY k.DateKPI
      ORDER BY k.DateKPI ASC
    `;

    const params = [
      { name: 'agenceId', type: TYPES.Int, value: parseInt(agenceId, 10) },
      { name: 'startDate', type: TYPES.Date, value: startDateObj },
      { name: 'endDate', type: TYPES.Date, value: endDateObj }
    ];

    console.log('🔍 DEBUG /kpi/detailed-data - Paramètres:', { agenceId, startDate, endDate });

    const results = await db.query(detailedQuery, params);
    
    console.log('🔍 DEBUG /kpi/detailed-data - Résultats:', results.length, 'enregistrements trouvés');

    const response = {
      data: results || [],
      agenceId: parseInt(agenceId, 10),
      startDate: startDate,
      endDate: endDate,
      totalRecords: results.length
    };

    console.log('🔍 DEBUG /kpi/detailed-data - Réponse finale:', response);
    res.json(response);
  } catch (err) {
    console.error('Erreur GET /kpi/detailed-data:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ message: 'Erreur lors de la récupération des données détaillées', error: err.message });
  }
});

// GET /api/kpi/highest-daily-rate - récupérer le taux journalier le plus élevé du jour
router.get('/highest-daily-rate', async (req, res) => {
  try {
    const { date } = req.query;
    
    // Utiliser la date du jour si non spécifiée
    const targetDate = date ? new Date(date) : new Date();
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;
    const day = targetDate.getDate();
    const dateKey = year * 10000 + month * 100 + day;
    
    console.log('🔍 DEBUG /kpi/highest-daily-rate - Paramètres:', { date, year, month, day, dateKey });
    
    const dateValue = convertDateKeyToSQLServer(dateKey);

    // Requête pour calculer le taux journalier pour chaque agence et trouver le maximum
    const query = `
      WITH DailyRates AS (
        SELECT 
          k.AgenceId,
          a.Nom_Agence,
          SUM(k.Encaissement_Journalier_Global) as Encaissement_Journalier_Global,
          MAX(o.Obj_Encaissement) as Obj_Encaissement,
          CASE 
            WHEN MAX(o.Obj_Encaissement) > 0 
            THEN ROUND((SUM(k.Encaissement_Journalier_Global) * 100.0) / MAX(o.Obj_Encaissement), 2)
            ELSE 0 
          END as Taux_Journalier
        FROM dbo.FAIT_KPI_ADE k
        LEFT JOIN dbo.DIM_AGENCE a ON k.AgenceId = a.AgenceId
        LEFT JOIN dbo.DIM_OBJECTIF o ON k.AgenceId = o.FK_Agence 
          AND o.DateDebut <= k.DateKPI 
          AND o.DateFin >= k.DateKPI 
          AND o.IsActive = 1
        WHERE k.DateKPI = @dateKey
        GROUP BY k.AgenceId, a.Nom_Agence
        HAVING SUM(k.Encaissement_Journalier_Global) IS NOT NULL 
          AND MAX(o.Obj_Encaissement) IS NOT NULL
          AND MAX(o.Obj_Encaissement) > 0
      )
      SELECT TOP 1
        AgenceId,
        Nom_Agence,
        Encaissement_Journalier_Global,
        Obj_Encaissement,
        Taux_Journalier
      FROM DailyRates
      WHERE Taux_Journalier IS NOT NULL AND Taux_Journalier > 0
      ORDER BY Taux_Journalier DESC
    `;

    const params = [
      { name: 'dateKey', type: TYPES.Date, value: dateValue }
    ];

    console.log('🔍 DEBUG /kpi/highest-daily-rate - Paramètres SQL:', params);

    const results = await db.query(query, params);
    
    console.log('🔍 DEBUG /kpi/highest-daily-rate - Résultats:', results);
    
    if (results && results.length > 0) {
      console.log('✅ /kpi/highest-daily-rate - Meilleur taux trouvé:', results[0]);
      res.json(results[0]);
    } else {
      console.log('⚠️ /kpi/highest-daily-rate - Aucun taux trouvé pour la date:', dateKey);
      res.json(null);
    }
  } catch (err) {
    console.error('❌ Erreur GET /kpi/highest-daily-rate:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ message: 'Erreur lors de la récupération du meilleur taux journalier', error: err.message });
  }
});

// GET /api/kpi/highest-daily-rate-centre - meilleur taux journalier par centre (moyenne stricte de toutes les agences, 0 si pas de KPI)
router.get('/highest-daily-rate-centre', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;
    const day = targetDate.getDate();
    const dateKey = year * 10000 + month * 100 + day;
    const dateValue = convertDateKeyToSQLServer(dateKey);
    // Strict average over all agencies with encaissement objective, KPI defaults to 0 if missing
    const query = `
      WITH AgenciesWithObjectives AS (
        SELECT a.AgenceId, a.FK_Centre AS CentreId, c.Nom_Centre, o.Obj_Encaissement
        FROM dbo.DIM_AGENCE a
        INNER JOIN dbo.DIM_CENTRE c ON a.FK_Centre = c.CentreId
        LEFT JOIN dbo.DIM_OBJECTIF o ON a.AgenceId = o.FK_Agence
          AND o.DateDebut <= @dateKey AND o.DateFin >= @dateKey AND o.IsActive = 1
        WHERE o.Obj_Encaissement IS NOT NULL AND o.Obj_Encaissement > 0
      ),
      AgencyKPI AS (
        SELECT k.AgenceId, k.Encaissement_Journalier_Global
        FROM dbo.FAIT_KPI_ADE k
        WHERE k.DateKPI = @dateKey
      ),
      CentreTaux AS (
        SELECT
          a.CentreId,
          a.Nom_Centre,
          CASE
            WHEN a.Obj_Encaissement > 0
            THEN ROUND(ISNULL(k.Encaissement_Journalier_Global, 0) * 100.0 / a.Obj_Encaissement, 2)
            ELSE 0
          END AS Taux_Agence
        FROM AgenciesWithObjectives a
        LEFT JOIN AgencyKPI k ON a.AgenceId = k.AgenceId
      )
      SELECT TOP 1
        CentreId, Nom_Centre, AVG(Taux_Agence) AS Taux_Journalier_Centre
      FROM CentreTaux
      GROUP BY CentreId, Nom_Centre
      ORDER BY AVG(Taux_Agence) DESC
    `;
    const params = [
      { name: 'dateKey', type: TYPES.Date, value: dateValue }
    ];
    const results = await db.query(query, params);
    if (results && results.length > 0) {
      const row = results[0];
      res.json({ CentreId: row.CentreId, Nom_Centre: row.Nom_Centre, Taux_Journalier: row.Taux_Journalier_Centre });
    } else {
      res.json(null);
    }
  } catch (err) {
    console.error('❌ Erreur GET /kpi/highest-daily-rate-centre:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération du meilleur taux journalier par centre', error: err.message });
  }
});

// GET /api/kpi/highest-monthly-average-rate-centre - meilleur taux mensuel par centre (moyenne des taux mensuels des agences)
router.get('/highest-monthly-average-rate-centre', async (req, res) => {
  try {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const query = `
      WITH MonthDays AS (
        SELECT @monthStart AS d
        UNION ALL
        SELECT DATEADD(DAY, 1, d) FROM MonthDays WHERE d < @monthEnd
      ),
      -- Encaissement cumulé par agence sur le mois jusqu'à aujourd'hui
      AgencyEnc AS (
        SELECT a.AgenceId, a.FK_Centre AS CentreId,
               SUM(k.Encaissement_Journalier_Global) AS Encaissement_Total
        FROM dbo.DIM_AGENCE a
        LEFT JOIN dbo.FAIT_KPI_ADE k ON a.AgenceId = k.AgenceId
          AND k.DateKPI >= @monthStart AND k.DateKPI <= @today
        GROUP BY a.AgenceId, a.FK_Centre
      ),
      -- Objectif total du mois par agence (somme sur tous les jours du mois)
      AgencyObj AS (
        SELECT a.AgenceId,
               SUM(ISNULL(o.Obj_Encaissement, 0)) AS Obj_Total_Mois
        FROM dbo.DIM_AGENCE a
        INNER JOIN MonthDays md ON 1 = 1
        LEFT JOIN dbo.DIM_OBJECTIF o ON a.AgenceId = o.FK_Agence
          AND o.IsActive = 1
          AND o.DateDebut <= md.d AND o.DateFin >= md.d
        GROUP BY a.AgenceId
      ),
      -- Taux mensuel par agence
      AgencyMonthlyRate AS (
        SELECT e.AgenceId,
               e.CentreId,
               CASE WHEN ISNULL(o.Obj_Total_Mois, 0) > 0
                    THEN ROUND(ISNULL(e.Encaissement_Total, 0) * 100.0 / o.Obj_Total_Mois, 2)
                    ELSE 0 END AS Taux_Mensuel_Agence
        FROM AgencyEnc e
        INNER JOIN AgencyObj o ON o.AgenceId = e.AgenceId
      )
      -- Moyenne des taux mensuels des agences par centre
      SELECT TOP 1 c.CentreId, c.Nom_Centre, AVG(amr.Taux_Mensuel_Agence) AS Taux_Mensuel_Centre
      FROM AgencyMonthlyRate amr
      INNER JOIN dbo.DIM_CENTRE c ON c.CentreId = amr.CentreId
      GROUP BY c.CentreId, c.Nom_Centre
      ORDER BY AVG(amr.Taux_Mensuel_Agence) DESC
      OPTION (MAXRECURSION 1000);
    `;

    const params = [
      { name: 'monthStart', type: TYPES.Date, value: monthStart },
      { name: 'monthEnd', type: TYPES.Date, value: monthEnd },
      { name: 'today', type: TYPES.Date, value: today }
    ];

    const results = await db.query(query, params);

    if (results && results.length > 0) {
      const row = results[0];
      res.json({ CentreId: row.CentreId, Nom_Centre: row.Nom_Centre, Taux_Mensuel: row.Taux_Mensuel_Centre });
    } else {
      res.json(null);
    }
  } catch (err) {
    console.error('❌ Erreur GET /kpi/highest-monthly-average-rate-centre:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération du meilleur taux mensuel par centre', error: err.message });
  }
});

// GET /api/kpi/highest-monthly-average-rate - meilleur taux mensuel (Mois en cours) basé sur l'objectif de tout le mois
router.get('/highest-monthly-average-rate', async (req, res) => {
  try {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const query = `
      WITH MonthDays AS (
        SELECT @monthStart AS d
        UNION ALL
        SELECT DATEADD(DAY, 1, d) FROM MonthDays WHERE d < @monthEnd
      ),
      AgencyEnc AS (
        SELECT a.AgenceId, a.Nom_Agence,
               SUM(k.Encaissement_Journalier_Global) AS Encaissement_Total
        FROM dbo.DIM_AGENCE a
        LEFT JOIN dbo.FAIT_KPI_ADE k ON a.AgenceId = k.AgenceId
          AND k.DateKPI >= @monthStart AND k.DateKPI <= @today
        GROUP BY a.AgenceId, a.Nom_Agence
      ),
      AgencyObj AS (
        SELECT a.AgenceId,
               SUM(ISNULL(o.Obj_Encaissement, 0)) AS Obj_Total_Mois
        FROM dbo.DIM_AGENCE a
        INNER JOIN MonthDays md ON 1 = 1
        LEFT JOIN dbo.DIM_OBJECTIF o ON a.AgenceId = o.FK_Agence
          AND o.IsActive = 1
          AND o.DateDebut <= md.d AND o.DateFin >= md.d
        GROUP BY a.AgenceId
      ),
      Final AS (
        SELECT e.AgenceId, e.Nom_Agence,
               ISNULL(e.Encaissement_Total, 0) AS Encaissement_Total,
               ISNULL(o.Obj_Total_Mois, 0) AS Obj_Total_Mois,
               CASE WHEN ISNULL(o.Obj_Total_Mois, 0) > 0
                    THEN ROUND(ISNULL(e.Encaissement_Total, 0) * 100.0 / o.Obj_Total_Mois, 2)
                    ELSE 0 END AS Taux_Mensuel
        FROM AgencyEnc e
        INNER JOIN AgencyObj o ON o.AgenceId = e.AgenceId
      )
      SELECT TOP 1 AgenceId, Nom_Agence, Encaissement_Total, Obj_Total_Mois, Taux_Mensuel
      FROM Final
      WHERE Obj_Total_Mois > 0
      ORDER BY Taux_Mensuel DESC
      OPTION (MAXRECURSION 1000);
    `;

    const params = [
      { name: 'monthStart', type: TYPES.Date, value: monthStart },
      { name: 'monthEnd', type: TYPES.Date, value: monthEnd },
      { name: 'today', type: TYPES.Date, value: today }
    ];

    console.log('🔍 DEBUG /kpi/highest-monthly-average-rate - Période:', { monthStart, monthEnd, today });

    const results = await db.query(query, params);

    if (results && results.length > 0) {
      const row = results[0];
      res.json({
        AgenceId: row.AgenceId,
        Nom_Agence: row.Nom_Agence,
        Taux_Moyen: row.Taux_Mensuel,
        Obj_Total_Mois: row.Obj_Total_Mois,
        Encaissement_Total: row.Encaissement_Total,
        StartDate: monthStart,
        EndDate: monthEnd,
        Today: today
      });
    } else {
      res.json(null);
    }
  } catch (err) {
    console.error('❌ Erreur GET /kpi/highest-monthly-average-rate:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération du taux moyen mensuel', error: err.message });
  }
});

module.exports = router;
