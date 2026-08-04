const express = require('express');
const db = require('../utils/db');
const { TYPES } = db;
const { sanitizeTextField } = require('../middleware/security');

const router = express.Router();

// GET /api/categories - liste des catégories
router.get('/', async (req, res) => {
  try {
    const categories = await db.query(`
      SELECT 
        CategorieId,
        CodeCategorie,
        Libelle,
        Description
      FROM dbo.DIM_CATEGORIE
      ORDER BY CodeCategorie
    `);
    res.json(categories);
  } catch (err) {
    console.error('Erreur DB /categories GET:', err);
    res.status(500).json({ message: 'Erreur lors de la lecture des catégories' });
  }
});

// POST /api/categories - créer une catégorie
router.post('/', async (req, res) => {
  const codeCategorie = sanitizeTextField(req.body?.codeCategorie, 50);
  const libelle = sanitizeTextField(req.body?.libelle, 200);
  const description = req.body?.description ? sanitizeTextField(req.body.description, 500) : null;

  if (!codeCategorie || !libelle) {
    return res.status(400).json({ message: 'CodeCategorie et Libelle sont requis' });
  }

  try {
    await db.query(`
      INSERT INTO dbo.DIM_CATEGORIE (CodeCategorie, Libelle, Description)
      VALUES (@codeCategorie, @libelle, @description)
    `, [
      { name: 'codeCategorie', type: TYPES.NVarChar, value: codeCategorie },
      { name: 'libelle', type: TYPES.NVarChar, value: libelle },
      { name: 'description', type: TYPES.NVarChar, value: description }
    ]);
    res.status(201).json({ message: 'Catégorie créée avec succès' });
  } catch (err) {
    console.error('Erreur DB /categories POST:', err);
    res.status(500).json({ message: 'Erreur lors de la création de la catégorie' });
  }
});

// PUT /api/categories/:id - modifier une catégorie
router.put('/:id', async (req, res) => {
  const idNum = parseInt(req.params.id, 10);
  if (isNaN(idNum) || idNum <= 0) {
    return res.status(400).json({ message: 'Identifiant de catégorie invalide' });
  }

  const codeCategorie = sanitizeTextField(req.body?.codeCategorie, 50);
  const libelle = sanitizeTextField(req.body?.libelle, 200);
  const description = req.body?.description ? sanitizeTextField(req.body.description, 500) : null;

  if (!codeCategorie || !libelle) {
    return res.status(400).json({ message: 'CodeCategorie et Libelle sont requis' });
  }

  try {
    const result = await db.execute(`
      UPDATE dbo.DIM_CATEGORIE
      SET CodeCategorie = @codeCategorie,
          Libelle = @libelle,
          Description = @description
      WHERE CategorieId = @id
    `, [
      { name: 'codeCategorie', type: TYPES.NVarChar, value: codeCategorie },
      { name: 'libelle', type: TYPES.NVarChar, value: libelle },
      { name: 'description', type: TYPES.NVarChar, value: description },
      { name: 'id', type: TYPES.Int, value: idNum }
    ]);
    if ((result.rowsAffected?.[0] || 0) === 0) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    res.json({ message: 'Catégorie mise à jour avec succès' });
  } catch (err) {
    console.error('Erreur DB /categories PUT:', err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la catégorie' });
  }
});

// DELETE /api/categories/:id - supprimer une catégorie
router.delete('/:id', async (req, res) => {
  const idNum = parseInt(req.params.id, 10);
  if (isNaN(idNum) || idNum <= 0) {
    return res.status(400).json({ message: 'Identifiant de catégorie invalide' });
  }

  try {
    const result = await db.execute(`
      DELETE FROM dbo.DIM_CATEGORIE
      WHERE CategorieId = @id
    `, [{ name: 'id', type: TYPES.Int, value: idNum }]);
    if ((result.rowsAffected?.[0] || 0) === 0) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (err) {
    console.error('Erreur DB /categories DELETE:', err);
    res.status(500).json({ message: 'Erreur lors de la suppression de la catégorie' });
  }
});

module.exports = router;
