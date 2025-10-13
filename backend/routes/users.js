const express = require('express');
const { Connection, Request, TYPES } = require('tedious');
const bcrypt = require('bcryptjs');

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

// GET /api/users - liste des utilisateurs
router.get('/', (req, res) => {
  const roleHeader = (req.headers['x-role'] || '').toString();
  const userIdHeader = req.headers['x-user-id'] || null;

  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur de connexion à la base', error: err.message });
    }

    const users = [];
    let query;
    let request;

    if (roleHeader === 'Administrateur') {
      // Admin voit tous les utilisateurs
      query = `
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
      `;
      request = new Request(query, (err) => {
        connection.close();
        if (err) {
          return res.status(500).json({ message: 'Erreur lors de la lecture des utilisateurs', error: err.message });
        }
        res.json(users);
      });
    } else {
      // Standard user ne voit que son propre profil
      query = `
        SELECT 
          UtilisateurId,
          Nom_Utilisateur AS username,
          [Role] AS role,
          Email AS email,
          FK_Agence AS agenceId
        FROM dbo.DIM_UTILISATEUR
        WHERE IsActive = 1 AND UtilisateurId = @userId
      `;
      request = new Request(query, (err) => {
        connection.close();
        if (err) {
          return res.status(500).json({ message: 'Erreur lors de la lecture des utilisateurs', error: err.message });
        }
        res.json(users);
      });
      request.addParameter('userId', TYPES.Int, parseInt(userIdHeader, 10));
    }

    request.on('row', (columns) => {
      const row = {};
      columns.forEach((c) => { row[c.metadata.colName] = c.value; });
      users.push(row);
    });

    connection.execSql(request);
  });

  connection.connect();
});

// POST /api/users - créer un utilisateur
router.post('/', (req, res) => {
  const roleHeader = (req.headers['x-role'] || '').toString();
  if (roleHeader !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé: droits insuffisants' });
  }
  const { username, email, role: roleRaw = 'Standard', password, agenceId } = req.body || {};

  // Normaliser le rôle reçu depuis le front
  const role = (roleRaw || '').toString().trim();
  const normalizedRole =
    role.toLowerCase() === 'admin' || role === 'Administrateur' ? 'Administrateur' : 'Standard';

  if (!username || !password || !email) {
    return res.status(400).json({ message: 'username, email et password sont requis' });
  }
  if (normalizedRole !== 'Administrateur' && (agenceId === undefined || agenceId === null)) {
    return res.status(400).json({ message: 'agenceId est requis pour les utilisateurs Standard' });
  }

  bcrypt.hash(password, 10, (hashErr, hash) => {
    if (hashErr) {
      return res.status(500).json({ message: 'Erreur lors du hashage du mot de passe' });
    }

    const connection = new Connection(getConfig());

    connection.on('connect', (err) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur de connexion à la base', error: err.message });
      }

      const query = `
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
      `;

      const request = new Request(query, (err) => {
        connection.close();
        if (err) {
          return res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur', error: err.message });
        }
      });

      let alreadyExists = null;
      let adminExists = null;

      request.addParameter('username', TYPES.NVarChar, username);
      request.addParameter('hash', TYPES.VarBinary, Buffer.from(hash));
      request.addParameter('role', TYPES.NVarChar, normalizedRole);
      request.addParameter('email', TYPES.NVarChar, email);
      request.addParameter('agenceId', TYPES.Int, normalizedRole === 'Administrateur' ? null : parseInt(agenceId, 10));

      request.on('row', (columns) => {
        columns.forEach((c) => {
          if (c.metadata.colName === 'AlreadyExists') {
            alreadyExists = c.value;
          }
          if (c.metadata.colName === 'AdminExists') {
            adminExists = c.value;
          }
        });
      });

      request.on('requestCompleted', () => {
        if (adminExists === 1) {
          return res.status(409).json({ message: 'Un administrateur existe déjà' });
        }
        if (alreadyExists === 1) {
          return res.status(409).json({ message: 'Cet utilisateur existe déjà' });
        }
        return res.status(201).json({ message: 'Utilisateur créé avec succès' });
      });

      connection.execSql(request);
    });

    connection.connect();
  });
});

// PUT /api/users/:id - modifier un utilisateur (email, role, agence)
router.put('/:id', (req, res) => {
  const roleHeader = (req.headers['x-role'] || '').toString();
  if (roleHeader !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé: droits insuffisants' });
  }
  const { id } = req.params;
  const { email, role, agenceId } = req.body || {};

  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) return res.status(500).json({ message: 'Erreur de connexion', error: err.message });

    const normalizedRole = (role === 'Administrateur') ? 'Administrateur' : 'Standard';
    const finalAgenceId = normalizedRole === 'Administrateur' ? null : parseInt(agenceId ?? 0, 10);

    const request = new Request(`
      UPDATE dbo.DIM_UTILISATEUR
      SET Email = @email,
          [Role] = @role,
          FK_Agence = @agenceId
      WHERE UtilisateurId = @id
    `, (err, rowCount) => {
      connection.close();
      if (err) return res.status(500).json({ message: 'Erreur lors de la mise à jour', error: err.message });
      if (rowCount === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });
      res.json({ message: 'Utilisateur mis à jour' });
    });

    request.addParameter('email', TYPES.NVarChar, email || null);
    request.addParameter('role', TYPES.NVarChar, normalizedRole);
    request.addParameter('agenceId', TYPES.Int, finalAgenceId);
    request.addParameter('id', TYPES.Int, parseInt(id, 10));

    connection.execSql(request);
  });

  connection.connect();
});

// DELETE /api/users/:id - désactiver un utilisateur
router.delete('/:id', (req, res) => {
  const roleHeader = (req.headers['x-role'] || '').toString();
  if (roleHeader !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé: droits insuffisants' });
  }
  const { id } = req.params;

  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) return res.status(500).json({ message: 'Erreur de connexion', error: err.message });

    const request = new Request(`
      UPDATE dbo.DIM_UTILISATEUR
      SET IsActive = 0
      WHERE UtilisateurId = @id
    `, (err, rowCount) => {
      connection.close();
      if (err) return res.status(500).json({ message: 'Erreur lors de la suppression', error: err.message });
      if (rowCount === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });
      res.json({ message: 'Utilisateur désactivé' });
    });

    request.addParameter('id', TYPES.Int, parseInt(id, 10));
    connection.execSql(request);
  });

  connection.connect();
});

// PUT /api/users/profile - modifier son propre profil (Standard users)
router.put('/profile', (req, res) => {
  const roleHeader = (req.headers['x-role'] || '').toString();
  const userIdHeader = req.headers['x-user-id'] || null;
  const { username, email, currentPassword, newPassword } = req.body || {};

  if (!userIdHeader) {
    return res.status(401).json({ message: 'Utilisateur non identifié' });
  }

  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) return res.status(500).json({ message: 'Erreur de connexion', error: err.message });

    // Vérifier le mot de passe actuel si un nouveau mot de passe est fourni
    if (newPassword) {
      const checkPasswordQuery = `
        SELECT Mot_de_Passe_Hash FROM dbo.DIM_UTILISATEUR 
        WHERE UtilisateurId = @userId AND IsActive = 1
      `;
      
      const checkRequest = new Request(checkPasswordQuery, (err) => {
        if (err) {
          // Fermer la connexion uniquement en cas d'erreur ici
          connection.close();
          return res.status(500).json({ message: 'Erreur lors de la vérification', error: err.message });
        }
      });

      checkRequest.addParameter('userId', TYPES.Int, parseInt(userIdHeader, 10));

      checkRequest.on('row', async (columns) => {
        const hashColumn = columns.find(c => c.metadata.colName === 'Mot_de_Passe_Hash');
        if (!hashColumn) {
          // Si aucun utilisateur, répondre et fermer
          connection.close();
          return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const storedHash = Buffer.from(hashColumn.value).toString('hex');
        const isValidPassword = await bcrypt.compare(currentPassword, storedHash);
        
        if (!isValidPassword) {
          // Mot de passe invalide, fermer la connexion et répondre
          connection.close();
          return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
        }

        // Mettre à jour le profil avec le nouveau mot de passe
        const newHash = await bcrypt.hash(newPassword, 10);
        updateProfile(newHash);
      });

      // Ici, on n'appelle pas updateProfile(null) car on est dans la branche newPassword
      // La fermeture de la connexion sera gérée dans updateProfile

      connection.execSql(checkRequest);
    } else {
      updateProfile(null);
    }

    function updateProfile(passwordHash) {
      let updateQuery = `
        UPDATE dbo.DIM_UTILISATEUR 
        SET Nom_Utilisateur = @username, Email = @email
      `;
      
      if (passwordHash) {
        updateQuery += `, Mot_de_Passe_Hash = @passwordHash`;
      }
      
      updateQuery += ` WHERE UtilisateurId = @userId`;

      const updateRequest = new Request(updateQuery, (err, rowCount) => {
        // La fermeture est gérée dans requestCompleted pour garantir la fin complète
        if (err) {
          connection.close();
          return res.status(500).json({ message: 'Erreur lors de la mise à jour', error: err.message });
        }
        if (rowCount === 0) {
          connection.close();
          return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        // Réponse dans requestCompleted pour éviter conflits avec le flux Tedious
      });

      updateRequest.addParameter('username', TYPES.NVarChar, username);
      updateRequest.addParameter('email', TYPES.NVarChar, email);
      updateRequest.addParameter('userId', TYPES.Int, parseInt(userIdHeader, 10));
      
      if (passwordHash) {
        updateRequest.addParameter('passwordHash', TYPES.VarBinary, Buffer.from(passwordHash));
      }

      updateRequest.on('requestCompleted', () => {
        connection.close();
        res.json({ message: 'Profil mis à jour avec succès' });
      });

      connection.execSql(updateRequest);
    }
  });

  connection.connect();
});

module.exports = router;
