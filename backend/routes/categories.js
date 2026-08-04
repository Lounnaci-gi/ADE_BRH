const express = require('express');
const { Connection, Request, TYPES } = require('tedious');
const { sanitizeTextField } = require('../middleware/security');

const router = express.Router();

const getConfig = () => ({
  server: process.env.DB_SERVER || 'localhost',
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DB_USER || 'lounnaci',
      password: process.env.DB_PASSWORD || 'Lounnaci2026!'
    }
  },
  options: {
    database: process.env.DB_DATABASE || 'ADE_KPI',
    trustServerCertificate: true,
    encrypt: false,
    instanceName: 'SQLEXPRESS',
    enableArithAbort: true
  }
});

// GET /api/categories - liste des catégories
router.get('/', (req, res) => {
  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      console.error('Erreur connexion DB /categories GET:', err);
      return res.status(500).json({ message: 'Erreur de connexion à la base de données' });
    }

    const categories = [];
    const query = `
      SELECT 
        CategorieId,
        CodeCategorie,
        Libelle,
        Description
      FROM dbo.DIM_CATEGORIE
      ORDER BY CodeCategorie
    `;

    const request = new Request(query, (err) => {
      connection.close();
      if (err) {
        console.error('Erreur DB /categories GET:', err);
        return res.status(500).json({ message: 'Erreur lors de la lecture des catégories' });
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

// POST /api/categories - créer une catégorie
router.post('/', (req, res) => {
  const rawCode   = req.body?.codeCategorie;
  const rawLibelle = req.body?.libelle;
  const rawDesc   = req.body?.description;

  // Sanitiser les champs texte libres
  const codeCategorie = sanitizeTextField(rawCode, 50);
  const libelle       = sanitizeTextField(rawLibelle, 200);
  const description   = rawDesc ? sanitizeTextField(rawDesc, 500) : null;

  if (!codeCategorie || !libelle) {
    return res.status(400).json({ message: 'CodeCategorie et Libelle sont requis' });
  }

  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      console.error('Erreur connexion DB /categories POST:', err);
      return res.status(500).json({ message: 'Erreur de connexion à la base de données' });
    }

    const query = `
      INSERT INTO dbo.DIM_CATEGORIE (CodeCategorie, Libelle, Description)
      VALUES (@codeCategorie, @libelle, @description)
    `;

    const request = new Request(query, (err, rowCount) => {
      connection.close();
      if (err) {
        console.error('Erreur DB /categories POST:', err);
        return res.status(500).json({ message: 'Erreur lors de la création de la catégorie' });
      }
      res.status(201).json({ message: 'Catégorie créée avec succès' });
    });

    request.addParameter('codeCategorie', TYPES.NVarChar, codeCategorie);
    request.addParameter('libelle', TYPES.NVarChar, libelle);
    request.addParameter('description', TYPES.NVarChar, description);

    connection.execSql(request);
  });

  connection.connect();
});

// PUT /api/categories/:id - modifier une catégorie
router.put('/:id', (req, res) => {
  const idNum = parseInt(req.params.id, 10);
  if (isNaN(idNum) || idNum <= 0) {
    return res.status(400).json({ message: 'Identifiant de catégorie invalide' });
  }

  const codeCategorie = sanitizeTextField(req.body?.codeCategorie, 50);
  const libelle       = sanitizeTextField(req.body?.libelle, 200);
  const description   = req.body?.description ? sanitizeTextField(req.body.description, 500) : null;

  if (!codeCategorie || !libelle) {
    return res.status(400).json({ message: 'CodeCategorie et Libelle sont requis' });
  }

  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      console.error('Erreur connexion DB /categories PUT:', err);
      return res.status(500).json({ message: 'Erreur de connexion à la base de données' });
    }

    const query = `
      UPDATE dbo.DIM_CATEGORIE
      SET CodeCategorie = @codeCategorie,
          Libelle = @libelle,
          Description = @description
      WHERE CategorieId = @id
    `;

    const request = new Request(query, (err, rowCount) => {
      connection.close();
      if (err) {
        console.error('Erreur DB /categories PUT:', err);
        return res.status(500).json({ message: 'Erreur lors de la mise à jour de la catégorie' });
      }
      if (rowCount === 0) {
        return res.status(404).json({ message: 'Catégorie non trouvée' });
      }
      res.json({ message: 'Catégorie mise à jour avec succès' });
    });

    request.addParameter('codeCategorie', TYPES.NVarChar, codeCategorie);
    request.addParameter('libelle', TYPES.NVarChar, libelle);
    request.addParameter('description', TYPES.NVarChar, description);
    request.addParameter('id', TYPES.Int, idNum);

    connection.execSql(request);
  });

  connection.connect();
});

// DELETE /api/categories/:id - supprimer une catégorie
router.delete('/:id', (req, res) => {
  const idNum = parseInt(req.params.id, 10);
  if (isNaN(idNum) || idNum <= 0) {
    return res.status(400).json({ message: 'Identifiant de catégorie invalide' });
  }

  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      console.error('Erreur connexion DB /categories DELETE:', err);
      return res.status(500).json({ message: 'Erreur de connexion à la base de données' });
    }

    const query = `
      DELETE FROM dbo.DIM_CATEGORIE
      WHERE CategorieId = @id
    `;

    const request = new Request(query, (err, rowCount) => {
      connection.close();
      if (err) {
        console.error('Erreur DB /categories DELETE:', err);
        return res.status(500).json({ message: 'Erreur lors de la suppression de la catégorie' });
      }
      if (rowCount === 0) {
        return res.status(404).json({ message: 'Catégorie non trouvée' });
      }
      res.json({ message: 'Catégorie supprimée avec succès' });
    });

    request.addParameter('id', TYPES.Int, idNum);

    connection.execSql(request);
  });

  connection.connect();
});

module.exports = router;
