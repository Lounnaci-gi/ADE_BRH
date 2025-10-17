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
      nbRelancesEnvoyees, mtRelancesEnvoyees,
      nbRelancesReglees, mtRelancesReglees,
      objCoupures, objDossiersJuridiques, objMisesEnDemeureEnvoyees, objRelancesEnvoyees
    } = req.body || {};

    if (!dateKey || !agenceId || !categorieId) {
      return res.status(400).json({ message: 'DateKey, AgenceId et CategorieId sont requis' });
    }

    // INSERT avec tous les champs
    const query = `
      INSERT INTO dbo.FAIT_KPI_ADE (
        DateKey, AgenceId, CategorieId,
        Nb_RelancesEnvoyees, Mt_RelancesEnvoyees,
        Nb_RelancesReglees, Mt_RelancesReglees,
        Nb_MisesEnDemeure_Envoyees, Mt_MisesEnDemeure_Envoyees,
        Nb_Dossiers_Juridiques, Mt_Dossiers_Juridiques,
        Nb_Coupures, Mt_Coupures,
        Encaissement_Journalier_Global
      ) VALUES (
        @dateKey, @agenceId, @categorieId,
        @nbRelancesEnvoyees, @mtRelancesEnvoyees,
        @nbRelancesReglees, @mtRelancesReglees,
        @nbMisesEnDemeureEnvoyees, @mtMisesEnDemeureEnvoyees,
        @nbDossiersJuridiques, @mtDossiersJuridiques,
        @nbCoupures, @mtCoupures,
        @encaissementJournalierGlobal
      )
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
      { name: 'nbDossiersJuridiques', type: TYPES.Int, value: parseInt(nbDossiersJuridiques || 0, 10) },
      { name: 'mtDossiersJuridiques', type: TYPES.Money, value: parseFloat(mtDossiersJuridiques || 0) },
      { name: 'nbCoupures', type: TYPES.Int, value: parseInt(nbCoupures || 0, 10) },
      { name: 'mtCoupures', type: TYPES.Money, value: parseFloat(mtCoupures || 0) },
      { name: 'encaissementJournalierGlobal', type: TYPES.Money, value: parseFloat(encaissementJournalierGlobal || 0) }
    ];

    console.log('Attempting to insert KPI with all fields:', { 
      dateKey, agenceId, categorieId,
      nbRelancesEnvoyees, mtRelancesEnvoyees,
      nbRelancesReglees, mtRelancesReglees,
      nbMisesEnDemeureEnvoyees, mtMisesEnDemeureEnvoyees,
      nbDossiersJuridiques, mtDossiersJuridiques,
      nbCoupures, mtCoupures,
      encaissementJournalierGlobal
    });
    await db.query(query, params);
    res.status(201).json({ message: 'KPI sauvegardé avec succès' });
  } catch (err) {
    console.error('Erreur POST /kpi:', err);
    console.error('Query:', query);
    console.error('Params:', params);
    res.status(500).json({ message: 'Erreur lors de la sauvegarde du KPI', error: err.message });
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
