const express = require('express');
const { Connection, Request, TYPES } = require('tedious');
const router = express.Router();

// Configuration de la base de données
const config = {
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
};

// Middleware pour vérifier le rôle administrateur
const requireAdmin = (req, res, next) => {
  const roleHeader = (req.headers['x-role'] || '').toString();
  if (roleHeader !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Rôle administrateur requis.' });
  }
  next();
};

// GET /api/communes - Lister toutes les communes
router.get('/', (req, res) => {
  const connection = new Connection(config);
  let hasResponded = false;

  connection.on('connect', (err) => {
    if (err) {
      console.error('Erreur de connexion à la base de données:', err);
      if (!hasResponded) {
        hasResponded = true;
        res.status(500).json({ message: 'Erreur de connexion à la base de données' });
        connection.close();
      }
      return;
    }

    const query = `
        SELECT 
            c.CommuneId, 
            c.Nom_Commune, 
            c.CreatedAt,
            a.Nom_Agence,
            a.AgenceId
        FROM DIM_COMMUNE c
        LEFT JOIN DIM_AGENCE a ON c.FK_Agence = a.AgenceId
        ORDER BY c.Nom_Commune
    `;
    const request = new Request(query, (err) => {
      if (err) {
        console.error('Erreur lors de l\'exécution de la requête:', err);
        if (!hasResponded) {
          hasResponded = true;
          res.status(500).json({ message: 'Erreur lors de la récupération des communes' });
          connection.close();
        }
      }
    });

    const communes = [];
    request.on('row', (columns) => {
      const commune = {};
      columns.forEach((column) => {
        commune[column.metadata.colName] = column.value;
      });
      communes.push(commune);
    });

    request.on('requestCompleted', () => {
      if (!hasResponded) {
        hasResponded = true;
        res.json(communes);
        connection.close();
      }
    });

    connection.execSql(request);
  });

  connection.connect();
});

// POST /api/communes - Créer une nouvelle commune
router.post('/', requireAdmin, (req, res) => {
  const { Nom_Commune, FK_Agence } = req.body || {};

  if (!Nom_Commune || !FK_Agence) {
    return res.status(400).json({
      message: 'Les champs Nom_Commune et FK_Agence sont obligatoires'
    });
  }

  const connection = new Connection(config);
  let hasResponded = false;

  connection.on('connect', (err) => {
    if (err) {
      console.error('Erreur de connexion à la base de données:', err);
      if (!hasResponded) {
        hasResponded = true;
        res.status(500).json({ message: 'Erreur de connexion à la base de données' });
        connection.close();
      }
      return;
    }

    // Vérifier si la commune existe déjà pour cette agence
    const checkQuery = 'SELECT CommuneId FROM DIM_COMMUNE WHERE Nom_Commune = @Nom_Commune AND FK_Agence = @FK_Agence';
    const checkRequest = new Request(checkQuery, (err) => {
      if (err) {
        console.error('Erreur lors de la vérification:', err);
        if (!hasResponded) {
          hasResponded = true;
          res.status(500).json({ message: 'Erreur lors de la vérification de la commune' });
          connection.close();
        }
        return;
      }
    });

    checkRequest.addParameter('Nom_Commune', TYPES.NVarChar, Nom_Commune);
    checkRequest.addParameter('FK_Agence', TYPES.Int, parseInt(FK_Agence, 10));

    checkRequest.on('row', () => {
      if (!hasResponded) {
        hasResponded = true;
        res.status(409).json({ message: 'Une commune avec ce nom existe déjà pour cette agence' });
        connection.close();
      }
    });

    checkRequest.on('requestCompleted', () => {
      if (hasResponded) return;

      // Créer la commune
      const insertQuery = `
        INSERT INTO DIM_COMMUNE (Nom_Commune, FK_Agence, CreatedAt)
        OUTPUT INSERTED.CommuneId
        VALUES (@Nom_Commune, @FK_Agence, SYSUTCDATETIME())
      `;
      const insertRequest = new Request(insertQuery, (err) => {
        if (err) {
          console.error('Erreur lors de la création de la commune:', err);
          if (!hasResponded) {
            hasResponded = true;
            res.status(500).json({ message: 'Erreur lors de la création de la commune' });
            connection.close();
          }
        }
      });

      insertRequest.addParameter('Nom_Commune', TYPES.NVarChar, Nom_Commune);
      insertRequest.addParameter('FK_Agence', TYPES.Int, parseInt(FK_Agence, 10));

      insertRequest.on('row', (columns) => {
        if (!hasResponded) {
          hasResponded = true;
          res.status(201).json({ 
            message: 'Commune créée avec succès',
            CommuneId: columns[0].value
          });
          connection.close();
        }
      });

      connection.execSql(insertRequest);
    });

    connection.execSql(checkRequest);
  });

  connection.connect();
});

// PUT /api/communes/:id - Modifier une commune
router.put('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { Nom_Commune, FK_Agence } = req.body || {};

  if (!Nom_Commune || !FK_Agence) {
    return res.status(400).json({
      message: 'Les champs Nom_Commune et FK_Agence sont obligatoires'
    });
  }

  const connection = new Connection(config);
  let hasResponded = false;

  connection.on('connect', (err) => {
    if (err) {
      console.error('Erreur de connexion à la base de données:', err);
      if (!hasResponded) {
        hasResponded = true;
        res.status(500).json({ message: 'Erreur de connexion à la base de données' });
        connection.close();
      }
      return;
    }

    // Vérifier si la commune existe
    const checkQuery = 'SELECT CommuneId FROM DIM_COMMUNE WHERE CommuneId = @CommuneId';
    const checkRequest = new Request(checkQuery, (err) => {
      if (err) {
        console.error('Erreur lors de la vérification:', err);
        if (!hasResponded) {
          hasResponded = true;
          res.status(500).json({ message: 'Erreur lors de la vérification de la commune' });
          connection.close();
        }
        return;
      }
    });

    checkRequest.addParameter('CommuneId', TYPES.Int, parseInt(id, 10));

    checkRequest.on('row', () => {
      // Vérifier si une autre commune a le même nom pour cette agence
      const conflictQuery = 'SELECT CommuneId FROM DIM_COMMUNE WHERE Nom_Commune = @Nom_Commune AND FK_Agence = @FK_Agence AND CommuneId != @CommuneId';
      const conflictRequest = new Request(conflictQuery, (err) => {
        if (err) {
          console.error('Erreur lors de la vérification de conflit:', err);
          if (!hasResponded) {
            hasResponded = true;
            res.status(500).json({ message: 'Erreur lors de la vérification de conflit' });
            connection.close();
          }
          return;
        }
      });

      conflictRequest.addParameter('Nom_Commune', TYPES.NVarChar, Nom_Commune);
      conflictRequest.addParameter('FK_Agence', TYPES.Int, parseInt(FK_Agence, 10));
      conflictRequest.addParameter('CommuneId', TYPES.Int, parseInt(id, 10));

      conflictRequest.on('row', () => {
        if (!hasResponded) {
          hasResponded = true;
          res.status(409).json({ message: 'Une autre commune avec ce nom existe déjà pour cette agence' });
          connection.close();
        }
      });

      conflictRequest.on('requestCompleted', () => {
        if (hasResponded) return;

        // Mettre à jour la commune
        const updateQuery = `
          UPDATE DIM_COMMUNE
          SET Nom_Commune = @Nom_Commune,
              FK_Agence = @FK_Agence
          WHERE CommuneId = @CommuneId
        `;
        const updateRequest = new Request(updateQuery, (err) => {
          if (err) {
            console.error('Erreur lors de la mise à jour de la commune:', err);
            if (!hasResponded) {
              hasResponded = true;
              res.status(500).json({ message: 'Erreur lors de la mise à jour de la commune' });
              connection.close();
            }
          } else {
            if (!hasResponded) {
              hasResponded = true;
              res.json({ message: 'Commune mise à jour avec succès' });
              connection.close();
            }
          }
        });

        updateRequest.addParameter('Nom_Commune', TYPES.NVarChar, Nom_Commune);
        updateRequest.addParameter('FK_Agence', TYPES.Int, parseInt(FK_Agence, 10));
        updateRequest.addParameter('CommuneId', TYPES.Int, parseInt(id, 10));

        connection.execSql(updateRequest);
      });

      connection.execSql(conflictRequest);
    });

    checkRequest.on('requestCompleted', () => {
      if (!hasResponded) {
        hasResponded = true;
        res.status(404).json({ message: 'Commune non trouvée' });
        connection.close();
      }
    });

    connection.execSql(checkRequest);
  });

  connection.connect();
});

// DELETE /api/communes/:id - Supprimer une commune
router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  const connection = new Connection(config);
  let hasResponded = false;

  connection.on('connect', (err) => {
    if (err) {
      console.error('Erreur de connexion à la base de données:', err);
      if (!hasResponded) {
        hasResponded = true;
        res.status(500).json({ message: 'Erreur de connexion à la base de données' });
        connection.close();
      }
      return;
    }

    // Effectuer l'opération en une seule requête séquentielle pour éviter les états invalides
    const batch = `
      DECLARE @exists INT = 0;
      SELECT @exists = COUNT(1) FROM DIM_COMMUNE WHERE CommuneId = @CommuneId;
      IF (@exists = 0)
      BEGIN
        SELECT CAST('NOT_FOUND' as nvarchar(20)) as Status, CAST(0 as int) as RefCount, CAST(NULL as nvarchar(2048)) as ErrorMessage;
        RETURN;
      END

      BEGIN TRY
        DELETE FROM DIM_COMMUNE WHERE CommuneId = @CommuneId;
        SELECT CAST('DELETED' as nvarchar(20)) as Status, CAST(0 as int) as RefCount, CAST(NULL as nvarchar(2048)) as ErrorMessage;
      END TRY
      BEGIN CATCH
        DECLARE @err INT = ERROR_NUMBER();
        DECLARE @msg NVARCHAR(2048) = ERROR_MESSAGE();
        IF (@err = 547)
        BEGIN
          -- Violation de contrainte FK
          SELECT CAST('FK_CONSTRAINT' as nvarchar(20)) as Status, CAST(0 as int) as RefCount, @msg as ErrorMessage;
        END
        ELSE
        BEGIN
          SELECT CAST('ERROR' as nvarchar(20)) as Status, CAST(0 as int) as RefCount, @msg as ErrorMessage;
        END
      END CATCH
    `;

    const request = new Request(batch, (err) => {
      if (err) {
        console.error('Erreur lors de la suppression de la commune (batch):', err);
        if (!hasResponded) {
          hasResponded = true;
          res.status(500).json({ message: 'Erreur lors de la suppression de la commune' });
          connection.close();
        }
      }
    });

    request.addParameter('CommuneId', TYPES.Int, parseInt(id, 10));

    let status = 'UNKNOWN';
    let refCount = 0;
    let errorMessage = null;
    request.on('row', (columns) => {
      columns.forEach((c) => {
        if (c.metadata.colName === 'Status') status = String(c.value);
        if (c.metadata.colName === 'RefCount') refCount = c.value || 0;
        if (c.metadata.colName === 'ErrorMessage') errorMessage = c.value ? String(c.value) : null;
      });
    });

    request.on('requestCompleted', () => {
      if (hasResponded) return;
      hasResponded = true;
      if (status === 'NOT_FOUND') {
        res.status(404).json({ message: 'Commune non trouvée' });
      } else if (status === 'FK_CONSTRAINT') {
        res.status(409).json({ message: 'Impossible de supprimer la commune: des données y sont rattachées', detail: errorMessage });
      } else if (status === 'DELETED') {
        res.json({ message: 'Commune supprimée avec succès' });
      } else {
        res.status(500).json({ message: 'Erreur lors de la suppression', detail: errorMessage });
      }
      connection.close();
    });

    connection.execSql(request);
  });

  connection.connect();
});

// GET /api/communes/agences - Récupérer la liste des agences
router.get('/agences', (req, res) => {
  const connection = new Connection(config);
  let hasResponded = false;

  connection.on('connect', (err) => {
    if (err) {
      console.error('Erreur de connexion à la base de données:', err);
      if (!hasResponded) {
        hasResponded = true;
        res.status(500).json({ message: 'Erreur de connexion à la base de données' });
        connection.close();
      }
      return;
    }

    const query = 'SELECT AgenceId, Nom_Agence FROM DIM_AGENCE ORDER BY Nom_Agence';
    const request = new Request(query, (err) => {
      if (err) {
        console.error('Erreur lors de l\'exécution de la requête:', err);
        if (!hasResponded) {
          hasResponded = true;
          res.status(500).json({ message: 'Erreur lors de la récupération des agences' });
          connection.close();
        }
      }
    });

    const agences = [];
    request.on('row', (columns) => {
      const agence = {};
      columns.forEach((column) => {
        agence[column.metadata.colName] = column.value;
      });
      agences.push(agence);
    });

    request.on('requestCompleted', () => {
      if (!hasResponded) {
        hasResponded = true;
        res.json(agences);
        connection.close();
      }
    });

    connection.execSql(request);
  });

  connection.connect();
});

module.exports = router;
