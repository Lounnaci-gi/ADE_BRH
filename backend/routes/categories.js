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

// GET /api/categories - liste des catégories
router.get('/', (req, res) => {
  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur de connexion à la base', error: err.message });
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

// POST /api/categories - créer une catégorie
router.post('/', (req, res) => {
  const { codeCategorie, libelle, description } = req.body || {};

  if (!codeCategorie || !libelle) {
    return res.status(400).json({ message: 'CodeCategorie et Libelle sont requis' });
  }

  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur de connexion à la base', error: err.message });
    }

    const query = `
      INSERT INTO dbo.DIM_CATEGORIE (CodeCategorie, Libelle, Description)
      VALUES (@codeCategorie, @libelle, @description)
    `;

    const request = new Request(query, (err, rowCount) => {
      connection.close();
      if (err) {
        return res.status(500).json({ message: 'Erreur lors de la création de la catégorie', error: err.message });
      }
      res.status(201).json({ message: 'Catégorie créée avec succès' });
    });

    request.addParameter('codeCategorie', TYPES.NVarChar, codeCategorie);
    request.addParameter('libelle', TYPES.NVarChar, libelle);
    request.addParameter('description', TYPES.NVarChar, description || null);

    connection.execSql(request);
  });

  connection.connect();
});

// PUT /api/categories/:id - modifier une catégorie
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { codeCategorie, libelle, description } = req.body || {};

  if (!codeCategorie || !libelle) {
    return res.status(400).json({ message: 'CodeCategorie et Libelle sont requis' });
  }

  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur de connexion à la base', error: err.message });
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
        return res.status(500).json({ message: 'Erreur lors de la mise à jour de la catégorie', error: err.message });
      }
      if (rowCount === 0) {
        return res.status(404).json({ message: 'Catégorie non trouvée' });
      }
      res.json({ message: 'Catégorie mise à jour avec succès' });
    });

    request.addParameter('codeCategorie', TYPES.NVarChar, codeCategorie);
    request.addParameter('libelle', TYPES.NVarChar, libelle);
    request.addParameter('description', TYPES.NVarChar, description || null);
    request.addParameter('id', TYPES.Int, parseInt(id, 10));

    connection.execSql(request);
  });

  connection.connect();
});

// DELETE /api/categories/:id - supprimer une catégorie
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur de connexion à la base', error: err.message });
    }

    const query = `
      DELETE FROM dbo.DIM_CATEGORIE
      WHERE CategorieId = @id
    `;

    const request = new Request(query, (err, rowCount) => {
      connection.close();
      if (err) {
        return res.status(500).json({ message: 'Erreur lors de la suppression de la catégorie', error: err.message });
      }
      if (rowCount === 0) {
        return res.status(404).json({ message: 'Catégorie non trouvée' });
      }
      res.json({ message: 'Catégorie supprimée avec succès' });
    });

    request.addParameter('id', TYPES.Int, parseInt(id, 10));

    connection.execSql(request);
  });

  connection.connect();
});

module.exports = router;
