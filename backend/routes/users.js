const express = require('express');
const bcrypt = require('bcryptjs');
const { sanitizeTextField } = require('../middleware/security');
const db = require('../utils/db');
const { TYPES } = db;

const router = express.Router();

// GET /api/users - liste des utilisateurs
router.get('/', async (req, res) => {
  const roleHeader = (req.headers['x-role'] || '').toString().trim();
  const userIdHeader = req.headers['x-user-id'] || null;

  if (!roleHeader || (roleHeader !== 'Administrateur' && roleHeader !== 'Standard')) {
    return res.status(401).json({ message: 'Authentification requise' });
  }

  try {
    if (roleHeader === 'Administrateur') {
      const users = await db.query(`
        SELECT 
          u.UtilisateurId,
          u.Nom_Utilisateur AS username,
          u.[Role] AS role,
          u.Email AS email,
          u.FK_Agence AS agenceId,
          a.Nom_Agence AS agence
        FROM dbo.DIM_UTILISATEUR u
        LEFT JOIN dbo.DIM_AGENCE a ON u.FK_Agence = a.AgenceId
        WHERE u.IsActive = 1
        ORDER BY u.Nom_Utilisateur
      `);
      return res.json(users);
    }

    const users = await db.query(`
      SELECT 
        UtilisateurId,
        Nom_Utilisateur AS username,
        [Role] AS role,
        Email AS email,
        FK_Agence AS agenceId
      FROM dbo.DIM_UTILISATEUR
      WHERE IsActive = 1 AND UtilisateurId = @userId
    `, [{ name: 'userId', type: TYPES.Int, value: parseInt(userIdHeader, 10) }]);
    return res.json(users);
  } catch (err) {
    console.error('Erreur DB /users GET:', err);
    return res.status(500).json({ message: 'Erreur lors de la lecture des utilisateurs' });
  }
});

// POST /api/users - créer un utilisateur
router.post('/', async (req, res) => {
  const roleHeader = (req.headers['x-role'] || '').toString().trim();
  if (!roleHeader) {
    return res.status(401).json({ message: 'Authentification requise' });
  }
  if (roleHeader !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé: droits administrateur requis' });
  }

  const username = sanitizeTextField(req.body?.username, 50);
  const email = sanitizeTextField(req.body?.email, 200);
  const { role: roleRaw = 'Standard', password, agenceId } = req.body || {};

  const role = (roleRaw || '').toString().trim();
  const normalizedRole =
    role.toLowerCase() === 'admin' || role === 'Administrateur' ? 'Administrateur' : 'Standard';

  if (!username || !password || !email) {
    return res.status(400).json({ message: 'username, email et password sont requis' });
  }
  if (normalizedRole !== 'Administrateur' && (agenceId === undefined || agenceId === null)) {
    return res.status(400).json({ message: 'agenceId est requis pour les utilisateurs Standard' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const rows = await db.query(`
      DECLARE @wantAdmin BIT = CASE WHEN @role = 'Administrateur' THEN 1 ELSE 0 END;
      DECLARE @existingAdminCount INT = (SELECT COUNT(*) FROM dbo.DIM_UTILISATEUR WHERE [Role] = 'Administrateur' AND IsActive = 1);
      DECLARE @existingUserCount INT = (SELECT COUNT(*) FROM dbo.DIM_UTILISATEUR WHERE Nom_Utilisateur = @username AND IsActive = 1);
      
      IF (@wantAdmin = 1 AND @existingAdminCount > 0)
      BEGIN
        SELECT CAST(1 AS INT) AS AdminExists, CAST(0 AS INT) AS AlreadyExists;
      END
      ELSE IF (@existingUserCount > 0)
      BEGIN
        SELECT CAST(0 AS INT) AS AdminExists, CAST(1 AS INT) AS AlreadyExists;
      END
      ELSE
      BEGIN
        INSERT INTO dbo.DIM_UTILISATEUR (Nom_Utilisateur, Mot_de_Passe_Hash, FK_Agence, [Role], Email, IsActive)
        VALUES (@username, @hash, @agenceId, @role, @email, 1);
        SELECT CAST(0 AS INT) AS AdminExists, CAST(0 AS INT) AS AlreadyExists;
      END
    `, [
      { name: 'username', type: TYPES.NVarChar, value: username },
      { name: 'hash', type: TYPES.VarBinary, value: Buffer.from(hash) },
      { name: 'role', type: TYPES.NVarChar, value: normalizedRole },
      { name: 'email', type: TYPES.NVarChar, value: email },
      { name: 'agenceId', type: TYPES.Int, value: normalizedRole === 'Administrateur' ? null : parseInt(agenceId, 10) }
    ]);

    const flags = rows[0] || {};
    if (flags.AdminExists === 1) {
      return res.status(409).json({ message: 'Un administrateur existe déjà' });
    }
    if (flags.AlreadyExists === 1) {
      return res.status(409).json({ message: 'Cet utilisateur existe déjà' });
    }
    return res.status(201).json({ message: 'Utilisateur créé avec succès' });
  } catch (err) {
    console.error('Erreur DB /users POST:', err);
    return res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
  }
});

// PUT /api/users/profile - modifier son propre profil
router.put('/profile', async (req, res) => {
  const roleHeader = (req.headers['x-role'] || '').toString().trim();
  const userIdHeader = req.headers['x-user-id'] || null;

  if (!roleHeader || (roleHeader !== 'Administrateur' && roleHeader !== 'Standard')) {
    return res.status(401).json({ message: 'Authentification requise' });
  }
  if (!userIdHeader) {
    return res.status(401).json({ message: 'Utilisateur non identifié' });
  }

  const { currentPassword, newPassword } = req.body || {};
  const username = sanitizeTextField(req.body?.username, 50);
  const email = sanitizeTextField(req.body?.email, 200);
  const userId = parseInt(userIdHeader, 10);

  try {
    let passwordHash = null;

    if (newPassword) {
      const rows = await db.query(`
        SELECT Mot_de_Passe_Hash FROM dbo.DIM_UTILISATEUR 
        WHERE UtilisateurId = @userId AND IsActive = 1
      `, [{ name: 'userId', type: TYPES.Int, value: userId }]);

      if (!rows.length) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      const storedHash = rows[0].Mot_de_Passe_Hash.toString();
      const isValidPassword = await bcrypt.compare(currentPassword, storedHash);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
      }
      passwordHash = await bcrypt.hash(newPassword, 10);
    }

    let updateQuery = `
      UPDATE dbo.DIM_UTILISATEUR 
      SET Nom_Utilisateur = @username, Email = @email
    `;
    const params = [
      { name: 'username', type: TYPES.NVarChar, value: username },
      { name: 'email', type: TYPES.NVarChar, value: email },
      { name: 'userId', type: TYPES.Int, value: userId }
    ];

    if (passwordHash) {
      updateQuery += `, Mot_de_Passe_Hash = @passwordHash`;
      params.push({ name: 'passwordHash', type: TYPES.VarBinary, value: Buffer.from(passwordHash) });
    }
    updateQuery += ` WHERE UtilisateurId = @userId`;

    const result = await db.execute(updateQuery, params);
    if ((result.rowsAffected?.[0] || 0) === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({ message: 'Profil mis à jour avec succès' });
  } catch (err) {
    console.error('Erreur DB /users/profile:', err);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
  }
});

// PUT /api/users/:id - modifier un utilisateur (email, role, agence)
router.put('/:id', async (req, res) => {
  const roleHeader = (req.headers['x-role'] || '').toString().trim();
  if (!roleHeader) {
    return res.status(401).json({ message: 'Authentification requise' });
  }
  if (roleHeader !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé: droits administrateur requis' });
  }

  const { id } = req.params;
  const { role, agenceId } = req.body || {};
  const email = sanitizeTextField(req.body?.email, 200);
  const normalizedRole = (role === 'Administrateur') ? 'Administrateur' : 'Standard';
  const finalAgenceId = normalizedRole === 'Administrateur' ? null : parseInt(agenceId ?? 0, 10);

  try {
    const result = await db.execute(`
      UPDATE dbo.DIM_UTILISATEUR
      SET Email = @email,
          [Role] = @role,
          FK_Agence = @agenceId
      WHERE UtilisateurId = @id
    `, [
      { name: 'email', type: TYPES.NVarChar, value: email || null },
      { name: 'role', type: TYPES.NVarChar, value: normalizedRole },
      { name: 'agenceId', type: TYPES.Int, value: finalAgenceId },
      { name: 'id', type: TYPES.Int, value: parseInt(id, 10) }
    ]);
    if ((result.rowsAffected?.[0] || 0) === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({ message: 'Utilisateur mis à jour' });
  } catch (err) {
    console.error('Erreur DB /users PUT:', err);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
});

// DELETE /api/users/:id - désactiver un utilisateur
router.delete('/:id', async (req, res) => {
  const roleHeader = (req.headers['x-role'] || '').toString().trim();
  if (!roleHeader) {
    return res.status(401).json({ message: 'Authentification requise' });
  }
  if (roleHeader !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé: droits administrateur requis' });
  }
  const { id } = req.params;

  try {
    const result = await db.execute(`
      UPDATE dbo.DIM_UTILISATEUR
      SET IsActive = 0
      WHERE UtilisateurId = @id
    `, [{ name: 'id', type: TYPES.Int, value: parseInt(id, 10) }]);
    if ((result.rowsAffected?.[0] || 0) === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({ message: 'Utilisateur désactivé' });
  } catch (err) {
    console.error('Erreur DB /users DELETE:', err);
    return res.status(500).json({ message: 'Erreur lors de la désactivation de l\'utilisateur' });
  }
});

module.exports = router;
