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
  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur de connexion à la base', error: err.message });
    }

    const users = [];
    const query = `
      SELECT 
        Nom_Utilisateur AS username,
        [Role] AS role,
        Email AS email
      FROM dbo.DIM_UTILISATEUR
      WHERE IsActive = 1
      ORDER BY Nom_Utilisateur
    `;

    const request = new Request(query, (err) => {
      connection.close();
      if (err) {
        return res.status(500).json({ message: 'Erreur lors de la lecture des utilisateurs', error: err.message });
      }
      res.json(users);
    });

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
  const { username, email, role: roleRaw = 'Standard', password } = req.body || {};

  // Normaliser le rôle reçu depuis le front
  const role = (roleRaw || '').toString().trim();
  const normalizedRole =
    role.toLowerCase() === 'admin' || role === 'Administrateur' ? 'Administrateur' : 'Standard';

  if (!username || !password || !email) {
    return res.status(400).json({ message: 'username, email et password sont requis' });
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
        IF (@wantAdmin = 1 AND EXISTS (SELECT 1 FROM dbo.DIM_UTILISATEUR WHERE [Role] = 'Administrateur' AND IsActive = 1))
        BEGIN
          SELECT CAST(1 AS INT) AS AdminExists, CAST(0 AS INT) AS AlreadyExists;
        END
        ELSE IF EXISTS (SELECT 1 FROM dbo.DIM_UTILISATEUR WHERE Nom_Utilisateur = @username)
        BEGIN
          SELECT CAST(0 AS INT) AS AdminExists, CAST(1 AS INT) AS AlreadyExists;
        END
        ELSE
        BEGIN
          INSERT INTO dbo.DIM_UTILISATEUR (Nom_Utilisateur, Mot_de_Passe_Hash, FK_Agence, [Role], Email, IsActive)
          VALUES (@username, @hash, NULL, @role, @email, 1);
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

module.exports = router;


