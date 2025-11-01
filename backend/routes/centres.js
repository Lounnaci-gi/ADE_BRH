const express = require('express');
const { TYPES } = require('tedious');
const db = require('../utils/db');
const router = express.Router();

// Configuration de la base de données
// SÉCURITÉ: Ne plus exposer de mots de passe en dur
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
    encrypt: false, // SÉCURITÉ: Activer en production avec encrypt: true
    database: process.env.DB_DATABASE || process.env.DB_NAME || 'ADE_KPI',
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
        c.Telephone2,
        c.Email,
        c.Fax,
        c.Nom_Banque,
        c.Compte_Bancaire,
        c.NIF,
        c.NIS,
        c.RC,
        c.CreatedAt,
        ISNULL(COUNT(a.AgenceId), 0) as Nombre_Agences
      FROM dbo.DIM_CENTRE c
      LEFT JOIN dbo.DIM_AGENCE a ON c.CentreId = a.FK_Centre
      GROUP BY c.CentreId, c.Nom_Centre, c.Adresse, c.Telephone, c.Telephone2, c.Email, c.Fax, c.Nom_Banque, c.Compte_Bancaire, c.NIF, c.NIS, c.RC, c.CreatedAt
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
router.post('/', async (req, res) => {
  const role = getRole(req);
  
  if (role !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent créer des centres.' });
  }

  const { nom_centre, adresse, telephone, telephone2, email, fax, nom_banque, compte_bancaire, nif, nis, rc } = req.body;

  if (!nom_centre || !adresse || !telephone) {
    return res.status(400).json({ message: 'Nom du centre, adresse et téléphone sont obligatoires' });
  }

  try {
    const exists = await db.query(
      'SELECT CentreId FROM dbo.DIM_CENTRE WHERE Nom_Centre = @nom_centre',
      [ { name: 'nom_centre', type: TYPES.NVarChar, value: nom_centre } ]
    );
    if (exists.length > 0) {
      return res.status(409).json({ message: 'Un centre avec ce nom existe déjà' });
    }

    const insertSql = `
      DECLARE @t TABLE(CentreId INT);
      INSERT INTO dbo.DIM_CENTRE (Nom_Centre, Adresse, Telephone, Telephone2, Email, Fax, Nom_Banque, Compte_Bancaire, NIF, NIS, RC, CreatedAt)
      OUTPUT INSERTED.CentreId INTO @t
      VALUES (@nom_centre, @adresse, @telephone, @telephone2, @email, @fax, @nom_banque, @compte_bancaire, @nif, @nis, @rc, SYSUTCDATETIME());
      SELECT CentreId FROM @t;`;

    const rows = await db.query(insertSql, [
      { name: 'nom_centre', type: TYPES.NVarChar, value: nom_centre },
      { name: 'adresse', type: TYPES.NVarChar, value: adresse },
      { name: 'telephone', type: TYPES.NVarChar, value: telephone },
      { name: 'telephone2', type: TYPES.NVarChar, value: telephone2 || null },
      { name: 'email', type: TYPES.NVarChar, value: email || null },
      { name: 'fax', type: TYPES.NVarChar, value: fax || null },
      { name: 'nom_banque', type: TYPES.NVarChar, value: nom_banque || null },
      { name: 'compte_bancaire', type: TYPES.NVarChar, value: compte_bancaire || null },
      { name: 'nif', type: TYPES.NVarChar, value: nif || null },
      { name: 'nis', type: TYPES.NVarChar, value: nis || null },
      { name: 'rc', type: TYPES.NVarChar, value: rc || null }
    ]);

    return res.status(201).json({ message: 'Centre créé avec succès', CentreId: rows[0]?.CentreId });
  } catch (err) {
    console.error('Erreur POST /centres:', err);
    return res.status(500).json({ message: 'Erreur lors de la création', error: err.message });
  }
});

// PUT /api/centres/:id - Modifier un centre
router.put('/:id', async (req, res) => {
  const role = getRole(req);
  
  if (role !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent modifier les centres.' });
  }

  const { id } = req.params;
  const { nom_centre, adresse, telephone, telephone2, email, fax, nom_banque, compte_bancaire, nif, nis, rc } = req.body;

  if (!nom_centre || !adresse || !telephone) {
    return res.status(400).json({ message: 'Nom du centre, adresse et téléphone sont obligatoires' });
  }

  try {
    const duplicate = await db.query(
      'SELECT CentreId FROM dbo.DIM_CENTRE WHERE Nom_Centre = @nom_centre AND CentreId <> @id',
      [
        { name: 'nom_centre', type: TYPES.NVarChar, value: nom_centre },
        { name: 'id', type: TYPES.Int, value: parseInt(id, 10) }
      ]
    );
    if (duplicate.length > 0) {
      return res.status(409).json({ message: 'Un centre avec ce nom existe déjà' });
    }

    const updateSql = `
      UPDATE dbo.DIM_CENTRE 
      SET 
        Nom_Centre = @nom_centre,
        Adresse = @adresse,
        Telephone = @telephone,
        Telephone2 = @telephone2,
        Email = @email,
        Fax = @fax,
        Nom_Banque = @nom_banque,
        Compte_Bancaire = @compte_bancaire,
        NIF = @nif,
        NIS = @nis,
        RC = @rc
      WHERE CentreId = @id`;

    await db.query(updateSql, [
      { name: 'id', type: TYPES.Int, value: parseInt(id, 10) },
      { name: 'nom_centre', type: TYPES.NVarChar, value: nom_centre },
      { name: 'adresse', type: TYPES.NVarChar, value: adresse },
      { name: 'telephone', type: TYPES.NVarChar, value: telephone },
      { name: 'telephone2', type: TYPES.NVarChar, value: telephone2 || null },
      { name: 'email', type: TYPES.NVarChar, value: email || null },
      { name: 'fax', type: TYPES.NVarChar, value: fax || null },
      { name: 'nom_banque', type: TYPES.NVarChar, value: nom_banque || null },
      { name: 'compte_bancaire', type: TYPES.NVarChar, value: compte_bancaire || null },
      { name: 'nif', type: TYPES.NVarChar, value: nif || null },
      { name: 'nis', type: TYPES.NVarChar, value: nis || null },
      { name: 'rc', type: TYPES.NVarChar, value: rc || null }
    ]);

    return res.json({ message: 'Centre modifié avec succès' });
  } catch (err) {
    console.error('Erreur PUT /centres/:id:', err);
    return res.status(500).json({ message: 'Erreur lors de la modification', error: err.message });
  }
});

// DELETE /api/centres/:id - Supprimer un centre
router.delete('/:id', async (req, res) => {
  const role = getRole(req);
  // SÉCURITÉ: Vérification stricte - rejeter si pas d'authentification
  if (!role) {
    return res.status(401).json({ message: 'Authentification requise' });
  }
  if (role !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent supprimer les centres.' });
  }
  
  // SÉCURITÉ: Valider l'ID
  const { id } = req.params;
  const idNum = parseInt(id, 10);
  if (isNaN(idNum) || idNum <= 0) {
    return res.status(400).json({ message: 'ID invalide' });
  }
  try {
    // Vérifier s'il existe des agences liées à ce centre
    const dependants = await db.query(
      'SELECT TOP 1 AgenceId FROM dbo.DIM_AGENCE WHERE FK_Centre = @id',
      [{ name: 'id', type: TYPES.Int, value: parseInt(id, 10) }]
    );
    if (dependants.length > 0) {
      return res.status(409).json({ message: 'Impossible de supprimer ce centre car des agences y sont rattachées.' });
    }

    await db.query('DELETE FROM dbo.DIM_CENTRE WHERE CentreId = @id', [
      { name: 'id', type: TYPES.Int, value: parseInt(id, 10) }
    ]);
    return res.json({ message: 'Centre supprimé avec succès' });
  } catch (err) {
    console.error('Erreur DELETE /centres/:id:', err);
    return res.status(500).json({ message: 'Erreur lors de la suppression', error: err.message });
  }
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
