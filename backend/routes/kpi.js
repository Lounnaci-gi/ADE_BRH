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

// GET /api/kpi - liste des KPIs avec jointures
router.get('/', (req, res) => {
  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur de connexion à la base', error: err.message });
    }

    const kpis = [];
    const query = `
      SELECT 
        k.DateKey,
        k.AgenceId,
        k.CategorieId,
        d.TheDate,
        a.Nom_Agence,
        c.Libelle AS CategorieLibelle,
        k.Encaissement_Journalier_Global,
        k.Nb_Coupures,
        k.Mt_Coupures,
        k.Nb_Dossiers_Juridiques,
        k.Mt_Dossiers_Juridiques,
        k.Nb_MisesEnDemeure_Envoyees,
        k.Mt_MisesEnDemeure_Envoyees,
        k.Nb_Relances_Envoyees,
        k.Mt_Relances_Envoyees,
        k.Nb_RelancesReglees,
        k.Mt_RelancesReglees,
        k.Obj_Coupures,
        k.Obj_Dossiers_Juridiques,
        k.Obj_MisesEnDemeure_Envoyees,
        k.Obj_Relances_Envoyees,
        k.CreatedAt,
        k.ModifiedAt
      FROM dbo.FAIT_KPI_ADE k
      LEFT JOIN dbo.DIM_DATE d ON k.DateKey = d.DateKey
      LEFT JOIN dbo.DIM_AGENCE a ON k.AgenceId = a.AgenceId
      LEFT JOIN dbo.DIM_CATEGORIE c ON k.CategorieId = c.CategorieId
      ORDER BY d.TheDate DESC, a.Nom_Agence, c.Libelle
    `;

    const request = new Request(query, (err) => {
      connection.close();
      if (err) {
        return res.status(500).json({ message: 'Erreur lors de la lecture des KPIs', error: err.message });
      }
      res.json(kpis);
    });

    request.on('row', (columns) => {
      const row = {};
      columns.forEach((c) => { row[c.metadata.colName] = c.value; });
      kpis.push(row);
    });

    connection.execSql(request);
  });

  connection.connect();
});

// POST /api/kpi - créer/insérer un KPI
router.post('/', (req, res) => {
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

  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur de connexion à la base', error: err.message });
    }

    const query = `
      MERGE dbo.FAIT_KPI_ADE AS target
      USING (SELECT @dateKey AS DateKey, @agenceId AS AgenceId, @categorieId AS CategorieId) AS source
      ON target.DateKey = source.DateKey 
         AND target.AgenceId = source.AgenceId 
         AND target.CategorieId = source.CategorieId
      WHEN MATCHED THEN
        UPDATE SET
          Encaissement_Journalier_Global = @encaissementJournalierGlobal,
          Nb_Coupures = @nbCoupures,
          Mt_Coupures = @mtCoupures,
          Nb_Dossiers_Juridiques = @nbDossiersJuridiques,
          Mt_Dossiers_Juridiques = @mtDossiersJuridiques,
          Nb_MisesEnDemeure_Envoyees = @nbMisesEnDemeureEnvoyees,
          Mt_MisesEnDemeure_Envoyees = @mtMisesEnDemeureEnvoyees,
          Nb_Relances_Envoyees = @nbRelancesEnvoyees,
          Mt_Relances_Envoyees = @mtRelancesEnvoyees,
          Nb_RelancesReglees = @nbRelancesReglees,
          Mt_RelancesReglees = @mtRelancesReglees,
          Obj_Coupures = @objCoupures,
          Obj_Dossiers_Juridiques = @objDossiersJuridiques,
          Obj_MisesEnDemeure_Envoyees = @objMisesEnDemeureEnvoyees,
          Obj_Relances_Envoyees = @objRelancesEnvoyees,
          ModifiedAt = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (DateKey, AgenceId, CategorieId, Encaissement_Journalier_Global, Nb_Coupures, Mt_Coupures,
                Nb_Dossiers_Juridiques, Mt_Dossiers_Juridiques, Nb_MisesEnDemeure_Envoyees, Mt_MisesEnDemeure_Envoyees,
                Nb_Relances_Envoyees, Mt_Relances_Envoyees, Nb_RelancesReglees, Mt_RelancesReglees,
                Obj_Coupures, Obj_Dossiers_Juridiques, Obj_MisesEnDemeure_Envoyees, Obj_Relances_Envoyees)
        VALUES (@dateKey, @agenceId, @categorieId, @encaissementJournalierGlobal, @nbCoupures, @mtCoupures,
                @nbDossiersJuridiques, @mtDossiersJuridiques, @nbMisesEnDemeureEnvoyees, @mtMisesEnDemeureEnvoyees,
                @nbRelancesEnvoyees, @mtRelancesEnvoyees, @nbRelancesReglees, @mtRelancesReglees,
                @objCoupures, @objDossiersJuridiques, @objMisesEnDemeureEnvoyees, @objRelancesEnvoyees);
    `;

    const request = new Request(query, (err, rowCount) => {
      connection.close();
      if (err) {
        return res.status(500).json({ message: 'Erreur lors de la sauvegarde du KPI', error: err.message });
      }
      res.status(201).json({ message: 'KPI sauvegardé avec succès' });
    });

    request.addParameter('dateKey', TYPES.Int, parseInt(dateKey, 10));
    request.addParameter('agenceId', TYPES.Int, parseInt(agenceId, 10));
    request.addParameter('categorieId', TYPES.Int, parseInt(categorieId, 10));
    request.addParameter('encaissementJournalierGlobal', TYPES.Money, parseFloat(encaissementJournalierGlobal || 0));
    request.addParameter('nbCoupures', TYPES.Int, parseInt(nbCoupures || 0, 10));
    request.addParameter('mtCoupures', TYPES.Money, parseFloat(mtCoupures || 0));
    request.addParameter('nbDossiersJuridiques', TYPES.Int, parseInt(nbDossiersJuridiques || 0, 10));
    request.addParameter('mtDossiersJuridiques', TYPES.Money, parseFloat(mtDossiersJuridiques || 0));
    request.addParameter('nbMisesEnDemeureEnvoyees', TYPES.Int, parseInt(nbMisesEnDemeureEnvoyees || 0, 10));
    request.addParameter('mtMisesEnDemeureEnvoyees', TYPES.Money, parseFloat(mtMisesEnDemeureEnvoyees || 0));
    request.addParameter('nbRelancesEnvoyees', TYPES.Int, parseInt(nbRelancesEnvoyees || 0, 10));
    request.addParameter('mtRelancesEnvoyees', TYPES.Money, parseFloat(mtRelancesEnvoyees || 0));
    request.addParameter('nbRelancesReglees', TYPES.Int, parseInt(nbRelancesReglees || 0, 10));
    request.addParameter('mtRelancesReglees', TYPES.Money, parseFloat(mtRelancesReglees || 0));
    request.addParameter('objCoupures', TYPES.Int, parseInt(objCoupures || 0, 10));
    request.addParameter('objDossiersJuridiques', TYPES.Int, parseInt(objDossiersJuridiques || 0, 10));
    request.addParameter('objMisesEnDemeureEnvoyees', TYPES.Int, parseInt(objMisesEnDemeureEnvoyees || 0, 10));
    request.addParameter('objRelancesEnvoyees', TYPES.Int, parseInt(objRelancesEnvoyees || 0, 10));

    connection.execSql(request);
  });

  connection.connect();
});

// GET /api/kpi/agences - liste des agences pour le formulaire
router.get('/agences', (req, res) => {
  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur de connexion à la base', error: err.message });
    }

    const agences = [];
    const query = `
      SELECT AgenceId, Nom_Agence
      FROM dbo.DIM_AGENCE
      ORDER BY Nom_Agence
    `;

    const request = new Request(query, (err) => {
      connection.close();
      if (err) {
        return res.status(500).json({ message: 'Erreur lors de la lecture des agences', error: err.message });
      }
      res.json(agences);
    });

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
