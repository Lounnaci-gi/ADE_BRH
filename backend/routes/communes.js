const express = require('express');
const { TYPES } = require('tedious');
const db = require('../utils/db');
const router = express.Router();

// La config est gérée par utils/db

// Middleware pour vérifier le rôle administrateur
const requireAdmin = (req, res, next) => {
  const roleHeader = (req.headers['x-role'] || '').toString();
  if (roleHeader !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Rôle administrateur requis.' });
  }
  next();
};

// GET /api/communes - Lister toutes les communes
router.get('/', async (req, res) => {
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

    // Vérifier si la commune existe
    const checkQuery = 'SELECT CommuneId FROM DIM_COMMUNE WHERE CommuneId = @CommuneId';
    let communeExists = false;
    const checkRequest = new Request(checkQuery, (err) => {
      if (err) {
        console.error('Erreur lors de la vérification:', err);
        if (!hasResponded) {
          hasResponded = true;
          const message = `Erreur lors de la vérification (SQL ${err?.number || 'NA'}): ${err?.message || ''}`;
          res.status(500).json({ message });
          connection.close();
        }
        return;
      }
    });

    checkRequest.addParameter('CommuneId', TYPES.Int, parseInt(id, 10));

    checkRequest.on('row', () => {
      communeExists = true;
    });

    checkRequest.on('requestCompleted', () => {
      if (!communeExists) {
        if (!hasResponded) {
          hasResponded = true;
          res.status(404).json({ message: 'Commune non trouvée' });
          connection.close();
        }
        return;
      }

      // Supprimer la commune (exécuter APRÈS la fin de la requête de vérification)
      const deleteQuery = 'DELETE FROM DIM_COMMUNE WHERE CommuneId = @CommuneId';
      const deleteRequest = new Request(deleteQuery, (err) => {
        if (err) {
          console.error('Erreur lors de la suppression de la commune:', err);
          if (!hasResponded) {
            hasResponded = true;
            // Détecter une contrainte de clé étrangère (erreur SQL Server 547)
            const isFkConstraint = err?.number === 547 || /REFERENCE constraint|conflicted with the REFERENCE constraint/i.test(String(err?.message || ''));
            const status = isFkConstraint ? 409 : 500;
            const message = isFkConstraint
              ? 'Impossible de supprimer: la commune est utilisée ailleurs (contrainte de référence).'
              : `Erreur lors de la suppression (SQL ${err?.number || 'NA'}): ${err?.message || ''}`;
            res.status(status).json({ message });
            connection.close();
          }
        } else {
          if (!hasResponded) {
            hasResponded = true;
            res.json({ message: 'Commune supprimée avec succès' });
            connection.close();
          }
        }
      });

      deleteRequest.addParameter('CommuneId', TYPES.Int, parseInt(id, 10));
      connection.execSql(deleteRequest);
    });

    connection.execSql(checkRequest);
  });

  connection.connect();
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

// GET /api/communes/count - Nombre total de communes
router.get('/count', (req, res) => {
  const role = getRole(req);
  
  if (role !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent consulter les communes.' });
  }

  const connection = new Connection(getConfig());

  connection.on('connect', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur de connexion à la base', error: err.message });
    }

    const query = 'SELECT COUNT(*) as count FROM dbo.DIM_COMMUNE';
    const request = new Request(query, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur lors de l\'exécution de la requête', error: err.message });
      }
    });

    request.on('row', (columns) => {
      const count = columns[0].value;
      res.json({ count });
    });

    connection.execSql(request);
  });

  connection.connect();
});

module.exports = router;
