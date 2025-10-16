const express = require('express');
const { TYPES } = require('tedious');
const db = require('../utils/db');
const router = express.Router();

// La config est gérée par utils/db

// Helper pour obtenir le rôle
const getRole = (req) => (req.headers['x-role'] || '').toString();

// Middleware pour vérifier le rôle administrateur
const requireAdmin = (req, res, next) => {
  const roleHeader = (req.headers['x-role'] || '').toString();
  if (roleHeader !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Rôle administrateur requis.' });
  }
  next();
};

// GET /api/communes - Lister toutes les communes (lecture pour tous les utilisateurs connectés)
router.get('/', async (req, res) => {
  const roleHeader = (req.headers['x-role'] || '').toString();
  
  // Permettre la lecture pour tous les utilisateurs connectés (Administrateur et Standard)
  if (!roleHeader || (roleHeader !== 'Administrateur' && roleHeader !== 'Standard')) {
    return res.status(403).json({ message: 'Accès refusé. Connexion requise.' });
  }

  try {
    const rows = await db.query(`
      SELECT c.CommuneId, c.Nom_Commune, c.CreatedAt, a.Nom_Agence, a.AgenceId
      FROM DIM_COMMUNE c
      LEFT JOIN DIM_AGENCE a ON c.FK_Agence = a.AgenceId
      ORDER BY c.Nom_Commune
    `);
    res.json(rows);
  } catch (err) {
    console.error('Erreur GET /communes:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des communes' });
  }
});

// POST /api/communes - Créer une nouvelle commune
router.post('/', requireAdmin, async (req, res) => {
  const { Nom_Commune, FK_Agence } = req.body || {};

  if (!Nom_Commune || !FK_Agence) {
    return res.status(400).json({
      message: 'Les champs Nom_Commune et FK_Agence sont obligatoires'
    });
  }
  try {
    const exists = await db.query(
      'SELECT CommuneId FROM DIM_COMMUNE WHERE Nom_Commune = @Nom_Commune AND FK_Agence = @FK_Agence',
      [
        { name: 'Nom_Commune', type: TYPES.NVarChar, value: Nom_Commune },
        { name: 'FK_Agence', type: TYPES.Int, value: parseInt(FK_Agence, 10) }
      ]
    );
    if (exists.length > 0) {
      return res.status(409).json({ message: 'Une commune avec ce nom existe déjà pour cette agence' });
    }
    const inserted = await db.query(
      `DECLARE @t TABLE(CommuneId INT);
       INSERT INTO DIM_COMMUNE (Nom_Commune, FK_Agence, CreatedAt)
       OUTPUT INSERTED.CommuneId INTO @t
       VALUES (@Nom_Commune, @FK_Agence, SYSUTCDATETIME());
       SELECT CommuneId FROM @t;`,
      [
        { name: 'Nom_Commune', type: TYPES.NVarChar, value: Nom_Commune },
        { name: 'FK_Agence', type: TYPES.Int, value: parseInt(FK_Agence, 10) }
      ]
    );
    res.status(201).json({ message: 'Commune créée avec succès', CommuneId: inserted[0]?.CommuneId });
  } catch (err) {
    console.error('Erreur POST /communes:', err);
    res.status(500).json({ message: 'Erreur lors de la création de la commune' });
  }
});

// PUT /api/communes/:id - Modifier une commune
router.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { Nom_Commune, FK_Agence } = req.body || {};

  if (!Nom_Commune || !FK_Agence) {
    return res.status(400).json({
      message: 'Les champs Nom_Commune et FK_Agence sont obligatoires'
    });
  }

  try {
    const exists = await db.query(
      'SELECT CommuneId FROM DIM_COMMUNE WHERE CommuneId = @CommuneId',
      [{ name: 'CommuneId', type: TYPES.Int, value: parseInt(id, 10) }]
    );
    if (exists.length === 0) {
      return res.status(404).json({ message: 'Commune non trouvée' });
    }
    const conflict = await db.query(
      'SELECT CommuneId FROM DIM_COMMUNE WHERE Nom_Commune = @Nom_Commune AND FK_Agence = @FK_Agence AND CommuneId != @CommuneId',
      [
        { name: 'Nom_Commune', type: TYPES.NVarChar, value: Nom_Commune },
        { name: 'FK_Agence', type: TYPES.Int, value: parseInt(FK_Agence, 10) },
        { name: 'CommuneId', type: TYPES.Int, value: parseInt(id, 10) }
      ]
    );
    if (conflict.length > 0) {
      return res.status(409).json({ message: 'Une autre commune avec ce nom existe déjà pour cette agence' });
    }
    await db.query(
      `UPDATE DIM_COMMUNE SET Nom_Commune = @Nom_Commune, FK_Agence = @FK_Agence WHERE CommuneId = @CommuneId`,
      [
        { name: 'Nom_Commune', type: TYPES.NVarChar, value: Nom_Commune },
        { name: 'FK_Agence', type: TYPES.Int, value: parseInt(FK_Agence, 10) },
        { name: 'CommuneId', type: TYPES.Int, value: parseInt(id, 10) }
      ]
    );
    res.json({ message: 'Commune mise à jour avec succès' });
  } catch (err) {
    console.error('Erreur PUT /communes/:id:', err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la commune' });
  }
});

// DELETE /api/communes/:id - Supprimer une commune
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const communeId = parseInt(id, 10);

  try {
    // Vérifier existence
    const exists = await db.query('SELECT CommuneId FROM dbo.DIM_COMMUNE WHERE CommuneId = @CommuneId', [
      { name: 'CommuneId', type: TYPES.Int, value: communeId }
    ]);
    if (exists.length === 0) {
      return res.status(404).json({ message: 'Commune non trouvée' });
    }

    // Tenter la suppression
    await db.query('DELETE FROM dbo.DIM_COMMUNE WHERE CommuneId = @CommuneId', [
      { name: 'CommuneId', type: TYPES.Int, value: communeId }
    ]);

    return res.json({ message: 'Commune supprimée avec succès' });
  } catch (err) {
    // Gérer les contraintes FK (erreur SQL Server 547)
    const isFkConstraint = err?.number === 547 || /REFERENCE constraint|conflicted with the REFERENCE constraint/i.test(String(err?.message || ''));
    if (isFkConstraint) {
      return res.status(409).json({ message: 'Impossible de supprimer cette commune: des données y sont rattachées.' });
    }
    console.error('Erreur DELETE /communes/:id:', err);
    return res.status(500).json({ message: 'Erreur lors de la suppression de la commune', error: err.message });
  }
});

// GET /api/communes/agences - Récupérer la liste des agences
router.get('/agences', async (req, res) => {
  try {
    const rows = await db.query('SELECT AgenceId, Nom_Agence FROM DIM_AGENCE ORDER BY Nom_Agence');
    res.json(rows);
  } catch (err) {
    console.error('Erreur GET /communes/agences:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des agences' });
  }
});

// GET /api/communes/count - Nombre total de communes (lecture pour tous les utilisateurs connectés)
router.get('/count', async (req, res) => {
  const role = getRole(req);
  
  // Permettre la lecture pour tous les utilisateurs connectés (Administrateur et Standard)
  if (!role || (role !== 'Administrateur' && role !== 'Standard')) {
    return res.status(403).json({ message: 'Accès refusé. Connexion requise.' });
  }
  try {
    const rows = await db.query('SELECT COUNT(*) as count FROM dbo.DIM_COMMUNE');
    return res.json({ count: rows[0]?.count || 0 });
  } catch (err) {
    console.error('Erreur GET /communes/count:', err);
    return res.status(500).json({ message: 'Erreur lors de la récupération du nombre de communes' });
  }
});

module.exports = router;
