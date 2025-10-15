const express = require('express');
const { TYPES } = require('tedious');
const db = require('../utils/db');
const router = express.Router();

// Configuration de la base de données
const getConfig = () => ({
  server: process.env.DB_SERVER || 'localhost',
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DB_USER || 'lounnaci',
      password: process.env.DB_PASSWORD || 'lounnaci'
    }
  },
  options: {
    encrypt: false,
    database: process.env.DB_NAME || 'ADE_KPI',
    trustServerCertificate: true
  }
});

// Helper pour obtenir le rôle
const getRole = (req) => (req.headers['x-role'] || '').toString();

// GET /api/centres - Liste des centres (lecture pour tous les utilisateurs connectés)
router.get('/', async (req, res) => {
  const role = getRole(req);
  
  // Permettre la lecture pour tous les utilisateurs connectés (Administrateur et Standard)
  if (!role || (role !== 'Administrateur' && role !== 'Standard')) {
    return res.status(403).json({ message: 'Accès refusé. Connexion requise.' });
  }

  try {
    const query = `
      SELECT 
        c.CentreId,
        c.Nom_Centre,
        c.Adresse,
        c.Telephone,
        c.Email,
        c.Fax,
        c.CreatedAt,
        ISNULL(COUNT(a.AgenceId), 0) as Nombre_Agences
      FROM dbo.DIM_CENTRE c
      LEFT JOIN dbo.DIM_AGENCE a ON c.CentreId = a.FK_Centre
      GROUP BY c.CentreId, c.Nom_Centre, c.Adresse, c.Telephone, c.Email, c.Fax, c.CreatedAt
      ORDER BY c.Nom_Centre
    `;

    const results = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error('Erreur GET /centres:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des centres', error: err.message });
  }
});

// POST /api/centres - Créer un centre
router.post('/', (req, res) => {
  const role = getRole(req);
  
  if (role !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent créer des centres.' });
  }

  const { nom_centre, adresse, telephone, email, fax } = req.body;

  if (!nom_centre || !adresse || !telephone) {
    return res.status(400).json({ message: 'Nom du centre, adresse et téléphone sont obligatoires' });
  }

  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur de connexion à la base', error: err.message });
    }

    const query = `
      INSERT INTO dbo.DIM_CENTRE (Nom_Centre, Adresse, Telephone, Email, Fax)
      VALUES (@nom_centre, @adresse, @telephone, @email, @fax)
    `;

    const request = new Request(query, (err, rowCount) => {
      if (err) {
        connection.close();
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ message: 'Un centre avec ce nom existe déjà' });
        }
        return res.status(500).json({ message: 'Erreur lors de la création', error: err.message });
      }
      connection.close();
      res.json({ 
        message: 'Centre créé avec succès',
        rowsAffected: rowCount
      });
    });

    request.addParameter('nom_centre', TYPES.NVarChar, nom_centre);
    request.addParameter('adresse', TYPES.NVarChar, adresse);
    request.addParameter('telephone', TYPES.NVarChar, telephone);
    request.addParameter('email', TYPES.NVarChar, email || null);
    request.addParameter('fax', TYPES.NVarChar, fax || null);

    connection.execSql(request);
  });

  connection.connect();
});

// PUT /api/centres/:id - Modifier un centre
router.put('/:id', (req, res) => {
  const role = getRole(req);
  
  if (role !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent modifier les centres.' });
  }

  const { id } = req.params;
  const { nom_centre, adresse, telephone, email, fax } = req.body;

  if (!nom_centre || !adresse || !telephone) {
    return res.status(400).json({ message: 'Nom du centre, adresse et téléphone sont obligatoires' });
  }

  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur de connexion à la base', error: err.message });
    }

    const query = `
      UPDATE dbo.DIM_CENTRE 
      SET 
        Nom_Centre = @nom_centre,
        Adresse = @adresse,
        Telephone = @telephone,
        Email = @email,
        Fax = @fax
      WHERE CentreId = @id
    `;

    const request = new Request(query, (err, rowCount) => {
      if (err) {
        connection.close();
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ message: 'Un centre avec ce nom existe déjà' });
        }
        return res.status(500).json({ message: 'Erreur lors de la modification', error: err.message });
      }
      connection.close();
      res.json({ 
        message: 'Centre modifié avec succès',
        rowsAffected: rowCount
      });
    });

    request.addParameter('id', TYPES.Int, parseInt(id));
    request.addParameter('nom_centre', TYPES.NVarChar, nom_centre);
    request.addParameter('adresse', TYPES.NVarChar, adresse);
    request.addParameter('telephone', TYPES.NVarChar, telephone);
    request.addParameter('email', TYPES.NVarChar, email || null);
    request.addParameter('fax', TYPES.NVarChar, fax || null);

    connection.execSql(request);
  });

  connection.connect();
});

// DELETE /api/centres/:id - Supprimer un centre
router.delete('/:id', (req, res) => {
  const role = getRole(req);
  
  if (role !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent supprimer les centres.' });
  }

  const { id } = req.params;
  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur de connexion à la base', error: err.message });
    }

    const query = `DELETE FROM dbo.DIM_CENTRE WHERE CentreId = @id`;

    const request = new Request(query, (err, rowCount) => {
      if (err) {
        connection.close();
        return res.status(500).json({ message: 'Erreur lors de la suppression', error: err.message });
      }
      connection.close();
      res.json({ 
        message: 'Centre supprimé avec succès',
        rowsAffected: rowCount
      });
    });

    request.addParameter('id', TYPES.Int, parseInt(id));

    connection.execSql(request);
  });

  connection.connect();
});

// GET /api/centres/count - Nombre total de centres (lecture pour tous les utilisateurs connectés)
router.get('/count', async (req, res) => {
  const role = getRole(req);
  
  // Permettre la lecture pour tous les utilisateurs connectés (Administrateur et Standard)
  if (!role || (role !== 'Administrateur' && role !== 'Standard')) {
    return res.status(403).json({ message: 'Accès refusé. Connexion requise.' });
  }

  try {
    const query = 'SELECT COUNT(*) as count FROM dbo.DIM_CENTRE';
    const results = await db.query(query);
    res.json({ count: results[0].count });
  } catch (err) {
    console.error('Erreur GET /centres/count:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération du nombre de centres', error: err.message });
  }
});

module.exports = router;
