const express = require('express');
const { TYPES } = require('tedious');
const db = require('../utils/db');
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

// Helper pour obtenir le rôle et l'ID utilisateur
const getRole = (req) => (req.headers['x-role'] || '').toString();
const getUserId = (req) => parseInt(req.headers['x-user-id'], 10) || null;

// Helper pour valider les règles temporelles des objectifs
const validateTemporalRules = (annee, mois) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // getMonth() retourne 0-11, on veut 1-12
  
  // Créer la date de l'objectif
  const objectiveDate = new Date(annee, mois - 1, 1); // mois - 1 car Date() utilise 0-11
  
  // Calculer les limites temporelles
  const threeMonthsAgo = new Date(currentYear, currentMonth - 4, 1); // 3 mois dans le passé
  const twoMonthsAhead = new Date(currentYear, currentMonth + 1, 1); // 2 mois dans le futur
  
  const errors = [];
  
  // Règle 1: Interdiction de créer/modifier dans le passé (> 3 mois)
  if (objectiveDate < threeMonthsAgo) {
    errors.push(`Impossible de créer ou modifier un objectif pour une période antérieure à 3 mois (${annee}-${mois.toString().padStart(2, '0')}). La période doit être postérieure à ${threeMonthsAgo.getFullYear()}-${(threeMonthsAgo.getMonth() + 1).toString().padStart(2, '0')}.`);
  }
  
  // Règle 2: Interdiction de créer dans le futur (> 2 mois)
  if (objectiveDate > twoMonthsAhead) {
    errors.push(`Impossible de créer un objectif pour une période supérieure à 2 mois dans le futur (${annee}-${mois.toString().padStart(2, '0')}). La période doit être antérieure à ${twoMonthsAhead.getFullYear()}-${(twoMonthsAhead.getMonth() + 1).toString().padStart(2, '0')}.`);
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// GET /api/objectives - Liste des objectifs (Admin seulement)
router.get('/', async (req, res) => {
  const role = getRole(req);
  
  if (role !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent consulter les objectifs.' });
  }

  try {
    // Récupérer les paramètres de filtrage
    const { annee, mois } = req.query;
    
    let whereClause = `WHERE o.IsActive = 1`;
    
    // Ajouter le filtrage par année et mois si spécifiés
    if (annee && mois) {
      whereClause += ` AND YEAR(o.DateDebut) = ${parseInt(annee)} AND MONTH(o.DateDebut) = ${parseInt(mois)}`;
    } else if (annee) {
      whereClause += ` AND YEAR(o.DateDebut) = ${parseInt(annee)}`;
    } else if (mois) {
      whereClause += ` AND MONTH(o.DateDebut) = ${parseInt(mois)}`;
    }

    const query = `
      SELECT 
        o.ObjectifId,
        o.FK_Agence AS AgenceId,
        a.Nom_Agence,
        o.FK_Categorie AS CategorieId,
        c.Libelle AS CategorieLibelle,
        YEAR(o.DateDebut) AS Annee,
        MONTH(o.DateDebut) AS Mois,
        o.DateDebut,
        o.DateFin,
        o.TypePeriode,
        o.Obj_Encaissement,
        o.Obj_Coupures,
        o.Obj_Retablissements,
        o.Obj_Branchements,
        o.Obj_Dossiers_Juridiques,
        o.Obj_MisesEnDemeure,
        o.Obj_Relances,
        o.Obj_Controles,
        o.Obj_Compteurs_Remplaces,
        o.Commentaire,
        o.CreatedAt,
        o.ModifiedAt
      FROM dbo.DIM_OBJECTIF o
      INNER JOIN dbo.DIM_AGENCE a ON o.FK_Agence = a.AgenceId
      LEFT JOIN dbo.DIM_CATEGORIE c ON o.FK_Categorie = c.CategorieId
      ${whereClause}
      ORDER BY o.DateDebut DESC, a.Nom_Agence, c.Libelle
    `;

    const results = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error('Erreur GET /objectives:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des objectifs', error: err.message });
  }
});

// GET /api/objectives/agences - Liste des agences pour le formulaire
router.get('/agences', async (req, res) => {
  const role = getRole(req);
  
  if (role !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent consulter les agences.' });
  }

  try {
    const query = 'SELECT AgenceId, Nom_Agence FROM dbo.DIM_AGENCE ORDER BY Nom_Agence';
    const results = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error('Erreur GET /objectives/agences:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des agences', error: err.message });
  }
});

// GET /api/objectives/categories - Liste des catégories pour le formulaire
router.get('/categories', async (req, res) => {
  const role = getRole(req);
  
  if (role !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent consulter les catégories.' });
  }

  try {
    const query = 'SELECT CategorieId, CodeCategorie, Libelle FROM dbo.DIM_CATEGORIE ORDER BY CodeCategorie';
    const results = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error('Erreur GET /objectives/categories:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des catégories', error: err.message });
  }
});

// GET /api/objectives/debug - Debug de la structure de la base de données
router.get('/debug', async (req, res) => {
  const role = getRole(req);
  
  if (role !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent consulter les informations de debug.' });
  }

  try {
    // Vérifier l'existence des tables
    const tablesQuery = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME IN ('DIM_AGENCE', 'FAIT_KPI_ADE', 'DIM_DATE', 'DIM_CENTRE')
      ORDER BY TABLE_NAME
    `;
    
    const tables = await db.query(tablesQuery);
    
    // Vérifier la structure de FAIT_KPI_ADE
    const structureQuery = `
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'FAIT_KPI_ADE'
      ORDER BY ORDINAL_POSITION
    `;
    
    const structure = await db.query(structureQuery);
    
    // Vérifier les données dans FAIT_KPI_ADE
    const dataQuery = `
      SELECT TOP 5 
        f.AgenceId,
        f.DateKey,
        f.Obj_Coupures,
        f.Obj_Dossiers_Juridiques,
        f.Obj_MisesEnDemeure_Envoyees,
        f.Obj_Relances_Envoyees
      FROM dbo.FAIT_KPI_ADE f
    `;
    
    const data = await db.query(dataQuery);
    
    // Vérifier si DIM_DATE existe et a les bonnes colonnes
    let dateStructure = null;
    try {
      const dateQuery = `
        SELECT 
          COLUMN_NAME,
          DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'DIM_DATE'
        ORDER BY ORDINAL_POSITION
      `;
      dateStructure = await db.query(dateQuery);
    } catch (err) {
      dateStructure = { error: 'Table DIM_DATE non trouvée' };
    }
    
    res.json({
      tables: tables,
      faitKpiStructure: structure,
      faitKpiData: data,
      dimDateStructure: dateStructure,
      message: 'Informations de debug récupérées avec succès'
    });
  } catch (err) {
    console.error('Erreur GET /objectives/debug:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des informations de debug', error: err.message });
  }
});

// POST /api/objectives - Créer un objectif
router.post('/', async (req, res) => {
  const role = getRole(req);
  const userId = getUserId(req);
  
  if (role !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent définir les objectifs.' });
  }

  const {
    agenceId,
    categorieId,
    dateDebut,
    dateFin,
    typePeriode,
    obj_Encaissement,
    obj_Coupures,
    obj_Retablissements,
    obj_Branchements,
    obj_Dossiers_Juridiques,
    obj_MisesEnDemeure,
    obj_Relances,
    obj_Controles,
    obj_Compteurs_Remplaces,
    commentaire
  } = req.body;

  // Validation
  if (!agenceId || !dateDebut || !dateFin || !typePeriode) {
    return res.status(400).json({ message: 'Agence, dates de début/fin et type de période sont requis' });
  }

  if (new Date(dateFin) < new Date(dateDebut)) {
    return res.status(400).json({ message: 'La date de fin doit être postérieure à la date de début' });
  }

  // Validation des règles temporelles pour la création
  const annee = new Date(dateDebut).getFullYear();
  const mois = new Date(dateDebut).getMonth() + 1;
  const temporalValidation = validateTemporalRules(annee, mois);
  if (!temporalValidation.isValid) {
    return res.status(403).json({ 
      message: 'Règles temporelles violées', 
      errors: temporalValidation.errors 
    });
  }

  try {
    // Vérifier s'il existe déjà un objectif pour cette agence, catégorie et période
    const existsQuery = `
      SELECT COUNT(*) as count
      FROM dbo.DIM_OBJECTIF
      WHERE FK_Agence = @agenceId
        AND (@categorieId IS NULL AND FK_Categorie IS NULL OR FK_Categorie = @categorieId)
        AND IsActive = 1
        AND (
          (DateDebut <= @dateDebut AND DateFin >= @dateDebut) OR
          (DateDebut <= @dateFin AND DateFin >= @dateFin) OR
          (DateDebut >= @dateDebut AND DateFin <= @dateFin)
        )
    `;
    const existsParams = [
      { name: 'agenceId', type: TYPES.Int, value: agenceId },
      { name: 'categorieId', type: TYPES.Int, value: categorieId || null },
      { name: 'dateDebut', type: TYPES.Date, value: new Date(dateDebut) },
      { name: 'dateFin', type: TYPES.Date, value: new Date(dateFin) }
    ];
    const existsRows = await db.query(existsQuery, existsParams);
    if (existsRows?.[0]?.count > 0) {
      return res.status(409).json({
        message: 'Un objectif existe déjà pour cette agence, catégorie et période.'
      });
    }
    
    // Insérer le nouvel objectif
    const insertQuery = `
      INSERT INTO dbo.DIM_OBJECTIF (
        FK_Agence, FK_Categorie, DateDebut, DateFin, TypePeriode,
        Obj_Encaissement, Obj_Coupures, Obj_Retablissements, Obj_Branchements,
        Obj_Dossiers_Juridiques, Obj_MisesEnDemeure, Obj_Relances,
        Obj_Controles, Obj_Compteurs_Remplaces, Commentaire,
        IsActive, CreatedBy, CreatedAt
      )
      VALUES (
        @agenceId, @categorieId, @dateDebut, @dateFin, @typePeriode,
        @obj_Encaissement, @obj_Coupures, @obj_Retablissements, @obj_Branchements,
        @obj_Dossiers_Juridiques, @obj_MisesEnDemeure, @obj_Relances,
        @obj_Controles, @obj_Compteurs_Remplaces, @commentaire,
        1, @createdBy, SYSUTCDATETIME()
      )
    `;
    
    const params = [
      { name: 'agenceId', type: TYPES.Int, value: agenceId },
      { name: 'categorieId', type: TYPES.Int, value: categorieId || null },
      { name: 'dateDebut', type: TYPES.Date, value: new Date(dateDebut) },
      { name: 'dateFin', type: TYPES.Date, value: new Date(dateFin) },
      { name: 'typePeriode', type: TYPES.NVarChar, value: typePeriode },
      { name: 'obj_Encaissement', type: TYPES.Money, value: obj_Encaissement || null },
      { name: 'obj_Coupures', type: TYPES.Int, value: obj_Coupures || null },
      { name: 'obj_Retablissements', type: TYPES.Int, value: obj_Retablissements || null },
      { name: 'obj_Branchements', type: TYPES.Int, value: obj_Branchements || null },
      { name: 'obj_Dossiers_Juridiques', type: TYPES.Int, value: obj_Dossiers_Juridiques || null },
      { name: 'obj_MisesEnDemeure', type: TYPES.Int, value: obj_MisesEnDemeure || null },
      { name: 'obj_Relances', type: TYPES.Int, value: obj_Relances || null },
      { name: 'obj_Controles', type: TYPES.Int, value: obj_Controles || null },
      { name: 'obj_Compteurs_Remplaces', type: TYPES.Int, value: obj_Compteurs_Remplaces || null },
      { name: 'commentaire', type: TYPES.NVarChar, value: commentaire || null },
      { name: 'createdBy', type: TYPES.Int, value: userId }
    ];
    
    const result = await db.query(insertQuery, params);
    res.json({ 
      message: 'Objectif créé avec succès',
      result: result
    });
  } catch (err) {
    console.error('Erreur POST /objectives:', err);
    res.status(500).json({ message: 'Erreur lors de la création', error: err.message });
  }
});

// PUT /api/objectives - Mettre à jour un objectif existant
router.put('/', async (req, res) => {
  const role = getRole(req);
  const userId = getUserId(req);
  
  if (role !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent modifier les objectifs.' });
  }

  const {
    objectifId,
    agenceId,
    categorieId,
    dateDebut,
    dateFin,
    typePeriode,
    obj_Encaissement,
    obj_Coupures,
    obj_Retablissements,
    obj_Branchements,
    obj_Dossiers_Juridiques,
    obj_MisesEnDemeure,
    obj_Relances,
    obj_Controles,
    obj_Compteurs_Remplaces,
    commentaire
  } = req.body;

  if (!objectifId) {
    return res.status(400).json({ message: 'ID de l\'objectif requis' });
  }

  if (!agenceId || !dateDebut || !dateFin || !typePeriode) {
    return res.status(400).json({ message: 'Agence, dates de début/fin et type de période sont requis' });
  }

  if (new Date(dateFin) < new Date(dateDebut)) {
    return res.status(400).json({ message: 'La date de fin doit être postérieure à la date de début' });
  }

  // Validation des règles temporelles pour la modification
  const annee = new Date(dateDebut).getFullYear();
  const mois = new Date(dateDebut).getMonth() + 1;
  const temporalValidation = validateTemporalRules(annee, mois);
  if (!temporalValidation.isValid) {
    return res.status(403).json({ 
      message: 'Règles temporelles violées', 
      errors: temporalValidation.errors 
    });
  }

  try {
    // Vérifier que l'objectif existe
    const exists = await db.query(
      `SELECT TOP 1 1 as ok FROM dbo.DIM_OBJECTIF WHERE ObjectifId = @objectifId AND IsActive = 1`,
      [{ name: 'objectifId', type: TYPES.Int, value: objectifId }]
    );
    if (exists.length === 0) {
      return res.status(404).json({ message: 'Objectif non trouvé' });
    }

    const updateSql = `
      UPDATE dbo.DIM_OBJECTIF
      SET 
        FK_Agence = @agenceId,
        FK_Categorie = @categorieId,
        DateDebut = @dateDebut,
        DateFin = @dateFin,
        TypePeriode = @typePeriode,
        Obj_Encaissement = @obj_Encaissement,
        Obj_Coupures = @obj_Coupures,
        Obj_Retablissements = @obj_Retablissements,
        Obj_Branchements = @obj_Branchements,
        Obj_Dossiers_Juridiques = @obj_Dossiers_Juridiques,
        Obj_MisesEnDemeure = @obj_MisesEnDemeure,
        Obj_Relances = @obj_Relances,
        Obj_Controles = @obj_Controles,
        Obj_Compteurs_Remplaces = @obj_Compteurs_Remplaces,
        Commentaire = @commentaire,
        ModifiedBy = @modifiedBy,
        ModifiedAt = SYSUTCDATETIME()
      WHERE ObjectifId = @objectifId`;

    await db.query(updateSql, [
      { name: 'objectifId', type: TYPES.Int, value: objectifId },
      { name: 'agenceId', type: TYPES.Int, value: agenceId },
      { name: 'categorieId', type: TYPES.Int, value: categorieId || null },
      { name: 'dateDebut', type: TYPES.Date, value: new Date(dateDebut) },
      { name: 'dateFin', type: TYPES.Date, value: new Date(dateFin) },
      { name: 'typePeriode', type: TYPES.NVarChar, value: typePeriode },
      { name: 'obj_Encaissement', type: TYPES.Money, value: obj_Encaissement || null },
      { name: 'obj_Coupures', type: TYPES.Int, value: obj_Coupures || null },
      { name: 'obj_Retablissements', type: TYPES.Int, value: obj_Retablissements || null },
      { name: 'obj_Branchements', type: TYPES.Int, value: obj_Branchements || null },
      { name: 'obj_Dossiers_Juridiques', type: TYPES.Int, value: obj_Dossiers_Juridiques || null },
      { name: 'obj_MisesEnDemeure', type: TYPES.Int, value: obj_MisesEnDemeure || null },
      { name: 'obj_Relances', type: TYPES.Int, value: obj_Relances || null },
      { name: 'obj_Controles', type: TYPES.Int, value: obj_Controles || null },
      { name: 'obj_Compteurs_Remplaces', type: TYPES.Int, value: obj_Compteurs_Remplaces || null },
      { name: 'commentaire', type: TYPES.NVarChar, value: commentaire || null },
      { name: 'modifiedBy', type: TYPES.Int, value: userId }
    ]);

    return res.json({ message: 'Objectif mis à jour avec succès' });
  } catch (err) {
    console.error('Erreur PUT /objectives:', err);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour', error: err.message });
  }
});

// DELETE /api/objectives - Supprimer un objectif (soft delete)
router.delete('/', async (req, res) => {
  const role = getRole(req);
  const userId = getUserId(req);
  
  if (role !== 'Administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent supprimer les objectifs.' });
  }

  const { objectifId } = req.body;
  
  if (!objectifId) {
    return res.status(400).json({ message: 'ID de l\'objectif requis' });
  }

  try {
    // Vérifier que l'objectif existe
    const exists = await db.query(
      `SELECT TOP 1 1 as ok FROM dbo.DIM_OBJECTIF WHERE ObjectifId = @objectifId AND IsActive = 1`,
      [{ name: 'objectifId', type: TYPES.Int, value: objectifId }]
    );
    if (exists.length === 0) {
      return res.status(404).json({ message: 'Objectif non trouvé' });
    }

    // Soft delete - marquer comme inactif
    const deleteQuery = `
      UPDATE dbo.DIM_OBJECTIF 
      SET 
        IsActive = 0,
        ModifiedBy = @modifiedBy,
        ModifiedAt = SYSUTCDATETIME()
      WHERE ObjectifId = @objectifId
    `;

    await db.query(deleteQuery, [
      { name: 'objectifId', type: TYPES.Int, value: objectifId },
      { name: 'modifiedBy', type: TYPES.Int, value: userId }
    ]);
    
    res.json({ 
      message: 'Objectif supprimé avec succès'
    });
  } catch (err) {
    console.error('Erreur DELETE /objectives:', err);
    res.status(500).json({ message: 'Erreur lors de la suppression', error: err.message });
  }
});

module.exports = router;
