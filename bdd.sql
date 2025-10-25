/*******************************************************
  Création base de données et utilisation
*******************************************************/
IF DB_ID(N'ADE_KPI') IS NULL
BEGIN
    CREATE DATABASE ADE_KPI;
END;
GO

USE ADE_KPI;
GO

/*******************************************************
  SUPPRESSION DES OBJETS EXISTANTS DANS LE BON ORDRE
*******************************************************/

-- Supprimer les tables dans l'ordre inverse des dépendances
IF OBJECT_ID('dbo.DIM_OBJECTIF') IS NOT NULL DROP TABLE dbo.DIM_OBJECTIF;
IF OBJECT_ID('dbo.FAIT_KPI_ADE') IS NOT NULL DROP TABLE dbo.FAIT_KPI_ADE;
IF OBJECT_ID('dbo.DIM_UTILISATEUR') IS NOT NULL DROP TABLE dbo.DIM_UTILISATEUR;
IF OBJECT_ID('dbo.DIM_COMMUNE') IS NOT NULL DROP TABLE dbo.DIM_COMMUNE;
IF OBJECT_ID('dbo.DIM_AGENCE') IS NOT NULL DROP TABLE dbo.DIM_AGENCE;
IF OBJECT_ID('dbo.DIM_CENTRE') IS NOT NULL DROP TABLE dbo.DIM_CENTRE;
IF OBJECT_ID('dbo.DIM_CATEGORIE') IS NOT NULL DROP TABLE dbo.DIM_CATEGORIE;
GO

/*******************************************************
  TABLE: DIM_CATEGORIE
*******************************************************/
CREATE TABLE dbo.DIM_CATEGORIE
(
    CategorieId INT IDENTITY(1,1) PRIMARY KEY,
    CodeCategorie NVARCHAR(50) NOT NULL UNIQUE,
    Libelle NVARCHAR(100) NOT NULL,
    Description NVARCHAR(250) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/*******************************************************
  TABLE: DIM_CENTRE
*******************************************************/
CREATE TABLE dbo.DIM_CENTRE
(
    CentreId INT IDENTITY(1,1) PRIMARY KEY,
    Nom_Centre NVARCHAR(200) NOT NULL,
    Adresse NVARCHAR(400) NOT NULL,
    Telephone NVARCHAR(50) NOT NULL,
    Telephone2 NVARCHAR(50) NULL,
    Email NVARCHAR(200) NULL,
    Fax NVARCHAR(50) NULL,
    
    -- Informations bancaires
    Nom_Banque NVARCHAR(200) NULL,
    Compte_Bancaire NVARCHAR(100) NULL,
    
    -- Identifications fiscales et commerciales
    NIF NVARCHAR(50) NULL,  -- Numéro d'Identification Fiscale
    NIS NVARCHAR(50) NULL,  -- Numéro d'Identification Statistique
    RC NVARCHAR(50) NULL,   -- Registre du Commerce
    
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_DIM_CENTRE_NOM UNIQUE (Nom_Centre)
);
GO

/*******************************************************
  TABLE: DIM_AGENCE
*******************************************************/
CREATE TABLE dbo.DIM_AGENCE
(
    AgenceId INT IDENTITY(1,1) PRIMARY KEY,
    FK_Centre INT NOT NULL,
    Nom_Agence NVARCHAR(200) NOT NULL,
    Adresse NVARCHAR(400) NOT NULL,
    Telephone NVARCHAR(50) NOT NULL,
    Telephone2 NVARCHAR(50) NULL,
    Email NVARCHAR(200) NULL,
    Fax NVARCHAR(50) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_DIM_AGENCE_NOM UNIQUE (Nom_Agence),
    CONSTRAINT FK_DIM_AGENCE_CENTRE FOREIGN KEY (FK_Centre) 
        REFERENCES dbo.DIM_CENTRE(CentreId) ON DELETE NO ACTION
);
GO

/*******************************************************
  TABLE: DIM_COMMUNE
*******************************************************/
CREATE TABLE dbo.DIM_COMMUNE
(
    CommuneId INT IDENTITY(1,1) PRIMARY KEY,
    FK_Agence INT NOT NULL,
    Nom_Commune NVARCHAR(200) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_DIM_COMMUNE_AGENCE FOREIGN KEY (FK_Agence) 
        REFERENCES dbo.DIM_AGENCE(AgenceId) ON DELETE CASCADE,
    CONSTRAINT UQ_DIM_COMMUNE_NOM_AGENCE UNIQUE (FK_Agence, Nom_Commune)
);
GO

/*******************************************************
  TABLE: DIM_UTILISATEUR
*******************************************************/
CREATE TABLE dbo.DIM_UTILISATEUR
(
    UtilisateurId INT IDENTITY(1,1) PRIMARY KEY,
    Nom_Utilisateur NVARCHAR(200) NOT NULL UNIQUE,
    Mot_de_Passe_Hash VARBINARY(128) NOT NULL,
    FK_Agence INT NULL,
    [Role] NVARCHAR(50) NOT NULL CHECK([Role] IN ('Standard','Administrateur')),
    Email NVARCHAR(200) NULL,
    Telephone NVARCHAR(50) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_DIM_UTILISATEUR_AGENCE FOREIGN KEY (FK_Agence) 
        REFERENCES dbo.DIM_AGENCE(AgenceId) ON DELETE SET NULL
);
GO

/*******************************************************
  TABLE: FAIT_KPI_ADE
*******************************************************/
CREATE TABLE dbo.FAIT_KPI_ADE
(
    KpiId INT IDENTITY(1,1) PRIMARY KEY,
    AgenceId INT NOT NULL,
    DateKPI DATE NOT NULL,
    CategorieId INT NOT NULL,

    -- Relances
    Nb_RelancesEnvoyees INT NOT NULL DEFAULT 0,
    Mt_RelancesEnvoyees MONEY NOT NULL DEFAULT 0,
    Nb_RelancesReglees INT NOT NULL DEFAULT 0,
    Mt_RelancesReglees MONEY NOT NULL DEFAULT 0,

    -- Mises en demeure
    Nb_MisesEnDemeure_Envoyees INT NOT NULL DEFAULT 0,
    Mt_MisesEnDemeure_Envoyees MONEY NOT NULL DEFAULT 0,
    Nb_MisesEnDemeure_Reglees INT NOT NULL DEFAULT 0,
    Mt_MisesEnDemeure_Reglees MONEY NOT NULL DEFAULT 0,

    -- Dossiers juridiques
    Nb_Dossiers_Juridiques INT NOT NULL DEFAULT 0,
    Mt_Dossiers_Juridiques MONEY NOT NULL DEFAULT 0,

    -- Coupures
    Nb_Coupures INT NOT NULL DEFAULT 0,
    Mt_Coupures MONEY NOT NULL DEFAULT 0,
    
    -- Rétablissements
    Nb_Retablissements INT NOT NULL DEFAULT 0,
    Mt_Retablissements MONEY NOT NULL DEFAULT 0,

    -- Branchements
    Nb_Branchements INT NOT NULL DEFAULT 0,
    
    -- Compteurs remplacés
    Nb_Compteurs_Remplaces INT NOT NULL DEFAULT 0,
        
    -- Contrôles
    Nb_Controles INT NOT NULL DEFAULT 0, 

    -- Encaissement
    Encaissement_Journalier_Global MONEY NULL,

    -- Observation
    Observation NVARCHAR(500) NULL,

    -- Audit
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedAt DATETIME2 NULL,

    CONSTRAINT UQ_FAIT_KPI_DATE_AGENCE_CAT UNIQUE (DateKPI, AgenceId, CategorieId),
    CONSTRAINT FK_FAITKPI_DIMAGENCE FOREIGN KEY (AgenceId) 
        REFERENCES dbo.DIM_AGENCE(AgenceId) ON DELETE CASCADE,
    CONSTRAINT FK_FAITKPI_DIMCATEGORIE FOREIGN KEY (CategorieId) 
        REFERENCES dbo.DIM_CATEGORIE(CategorieId) ON DELETE NO ACTION
);
GO

/*******************************************************
  TABLE: DIM_OBJECTIF
*******************************************************/
CREATE TABLE dbo.DIM_OBJECTIF
(
    ObjectifId INT IDENTITY(1,1) PRIMARY KEY,
    FK_Agence INT NOT NULL,
    
    -- Période de validité
    DateDebut DATE NOT NULL,
    DateFin DATE NOT NULL,
    
    -- Libellé de l'objectif
    Titre NVARCHAR(200) NOT NULL,
    Description NVARCHAR(500) NULL,
    
    -- Objectifs numériques
    Obj_Encaissement MONEY NULL,
    Obj_Coupures INT NULL,
    Obj_Dossiers_Juridiques INT NULL,
    Obj_MisesEnDemeure INT NULL,
    Obj_Relances INT NULL,
    Obj_Controles INT NULL,
    Obj_Compteurs_Remplaces INT NULL,
    
    -- Suivi
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy INT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedBy INT NULL,
    ModifiedAt DATETIME2 NULL,
    
    CONSTRAINT FK_OBJECTIF_AGENCE FOREIGN KEY (FK_Agence) 
        REFERENCES dbo.DIM_AGENCE(AgenceId) ON DELETE CASCADE,
    CONSTRAINT FK_OBJECTIF_CREATEDBY FOREIGN KEY (CreatedBy) 
        REFERENCES dbo.DIM_UTILISATEUR(UtilisateurId) ON DELETE NO ACTION,
    CONSTRAINT FK_OBJECTIF_MODIFIEDBY FOREIGN KEY (ModifiedBy) 
        REFERENCES dbo.DIM_UTILISATEUR(UtilisateurId) ON DELETE NO ACTION,
    
    -- Contrainte : dates cohérentes
    CONSTRAINT CHK_OBJECTIF_DATES CHECK (DateFin >= DateDebut)
);
GO

/*******************************************************
  INDEX NON-CLUSTERED
*******************************************************/

-- INDEX SUR DIM_CATEGORIE
CREATE NONCLUSTERED INDEX IX_DIM_CATEGORIE_Code
ON dbo.DIM_CATEGORIE(CodeCategorie)
INCLUDE (Libelle, Description);
GO

-- INDEX SUR DIM_CENTRE
CREATE NONCLUSTERED INDEX IX_DIM_CENTRE_Nom
ON dbo.DIM_CENTRE(Nom_Centre);
GO

CREATE NONCLUSTERED INDEX IX_DIM_CENTRE_CreatedAt
ON dbo.DIM_CENTRE(CreatedAt DESC);
GO

-- Index pour recherches par identifiants fiscaux
CREATE NONCLUSTERED INDEX IX_DIM_CENTRE_NIF
ON dbo.DIM_CENTRE(NIF)
WHERE NIF IS NOT NULL;
GO

CREATE NONCLUSTERED INDEX IX_DIM_CENTRE_NIS
ON dbo.DIM_CENTRE(NIS)
WHERE NIS IS NOT NULL;
GO

CREATE NONCLUSTERED INDEX IX_DIM_CENTRE_RC
ON dbo.DIM_CENTRE(RC)
WHERE RC IS NOT NULL;
GO

-- INDEX SUR DIM_AGENCE
CREATE NONCLUSTERED INDEX IX_DIM_AGENCE_Centre
ON dbo.DIM_AGENCE(FK_Centre)
INCLUDE (Nom_Agence, Telephone, Email);
GO

CREATE NONCLUSTERED INDEX IX_DIM_AGENCE_Nom
ON dbo.DIM_AGENCE(Nom_Agence);
GO

CREATE NONCLUSTERED INDEX IX_DIM_AGENCE_Centre_Nom
ON dbo.DIM_AGENCE(FK_Centre, Nom_Agence);
GO

-- INDEX SUR DIM_COMMUNE
CREATE NONCLUSTERED INDEX IX_DIM_COMMUNE_Agence
ON dbo.DIM_COMMUNE(FK_Agence)
INCLUDE (Nom_Commune);
GO

CREATE NONCLUSTERED INDEX IX_DIM_COMMUNE_Nom
ON dbo.DIM_COMMUNE(Nom_Commune);
GO

-- INDEX SUR DIM_UTILISATEUR
CREATE NONCLUSTERED INDEX IX_DIM_UTILISATEUR_Agence
ON dbo.DIM_UTILISATEUR(FK_Agence)
WHERE FK_Agence IS NOT NULL;
GO

CREATE NONCLUSTERED INDEX IX_DIM_UTILISATEUR_Role
ON dbo.DIM_UTILISATEUR([Role])
INCLUDE (Nom_Utilisateur, Email, IsActive);
GO

CREATE NONCLUSTERED INDEX IX_DIM_UTILISATEUR_Active
ON dbo.DIM_UTILISATEUR(IsActive, [Role])
WHERE IsActive = 1;
GO

CREATE NONCLUSTERED INDEX IX_DIM_UTILISATEUR_Email
ON dbo.DIM_UTILISATEUR(Email)
WHERE Email IS NOT NULL;
GO

-- INDEX SUR FAIT_KPI_ADE
CREATE NONCLUSTERED INDEX IX_FAIT_KPI_Date_Agence
ON dbo.FAIT_KPI_ADE(DateKPI, AgenceId)
INCLUDE (CategorieId, Encaissement_Journalier_Global, Nb_Coupures, Nb_RelancesEnvoyees);
GO

CREATE NONCLUSTERED INDEX IX_FAIT_KPI_Agence_Date
ON dbo.FAIT_KPI_ADE(AgenceId, DateKPI DESC)
INCLUDE (CategorieId, Encaissement_Journalier_Global, Nb_Coupures);
GO

CREATE NONCLUSTERED INDEX IX_FAIT_KPI_Categorie_Date
ON dbo.FAIT_KPI_ADE(CategorieId, DateKPI DESC)
INCLUDE (AgenceId, Encaissement_Journalier_Global);
GO

CREATE NONCLUSTERED INDEX IX_FAIT_KPI_Agence_Cat_Date
ON dbo.FAIT_KPI_ADE(AgenceId, CategorieId, DateKPI DESC)
INCLUDE (Encaissement_Journalier_Global, Nb_Coupures, Nb_RelancesEnvoyees);
GO

CREATE NONCLUSTERED INDEX IX_FAIT_KPI_Date_YearMonth
ON dbo.FAIT_KPI_ADE(DateKPI DESC)
INCLUDE (AgenceId, CategorieId, Encaissement_Journalier_Global, Nb_Coupures);
GO

CREATE NONCLUSTERED INDEX IX_FAIT_KPI_ModifiedAt
ON dbo.FAIT_KPI_ADE(ModifiedAt DESC)
INCLUDE (AgenceId, DateKPI)
WHERE ModifiedAt IS NOT NULL;
GO

CREATE NONCLUSTERED INDEX IX_FAIT_KPI_Encaissement_Date
ON dbo.FAIT_KPI_ADE(DateKPI DESC, Encaissement_Journalier_Global DESC)
INCLUDE (AgenceId, CategorieId)
WHERE Encaissement_Journalier_Global IS NOT NULL;
GO

CREATE NONCLUSTERED INDEX IX_FAIT_KPI_DateRange
ON dbo.FAIT_KPI_ADE(DateKPI, AgenceId, CategorieId)
INCLUDE (Encaissement_Journalier_Global, Nb_Coupures, Nb_Retablissements, Nb_Branchements);
GO

-- INDEX SUR DIM_OBJECTIF
CREATE NONCLUSTERED INDEX IX_DIM_OBJECTIF_Agence
ON dbo.DIM_OBJECTIF(FK_Agence)
INCLUDE (DateDebut, DateFin, Titre, IsActive);
GO

CREATE NONCLUSTERED INDEX IX_DIM_OBJECTIF_Active
ON dbo.DIM_OBJECTIF(IsActive, FK_Agence)
WHERE IsActive = 1;
GO

CREATE NONCLUSTERED INDEX IX_DIM_OBJECTIF_Periode
ON dbo.DIM_OBJECTIF(DateDebut, DateFin)
INCLUDE (FK_Agence, Titre, IsActive);
GO

CREATE NONCLUSTERED INDEX IX_DIM_OBJECTIF_Agence_Periode_Active
ON dbo.DIM_OBJECTIF(FK_Agence, DateDebut, DateFin, IsActive)
INCLUDE (Titre, Obj_Encaissement, Obj_Coupures, Obj_Relances);
GO

CREATE NONCLUSTERED INDEX IX_DIM_OBJECTIF_CreatedAt
ON dbo.DIM_OBJECTIF(CreatedAt DESC);
GO

CREATE NONCLUSTERED INDEX IX_DIM_OBJECTIF_CreatedBy
ON dbo.DIM_OBJECTIF(CreatedBy)
WHERE CreatedBy IS NOT NULL;
GO

CREATE NONCLUSTERED INDEX IX_DIM_OBJECTIF_DateRange_Active
ON dbo.DIM_OBJECTIF(DateDebut, DateFin, IsActive)
INCLUDE (FK_Agence, Titre, Obj_Encaissement)
WHERE IsActive = 1;
GO

/*******************************************************
  STATISTIQUES
*******************************************************/
UPDATE STATISTICS dbo.DIM_CATEGORIE WITH FULLSCAN;
UPDATE STATISTICS dbo.DIM_CENTRE WITH FULLSCAN;
UPDATE STATISTICS dbo.DIM_AGENCE WITH FULLSCAN;
UPDATE STATISTICS dbo.DIM_COMMUNE WITH FULLSCAN;
UPDATE STATISTICS dbo.DIM_UTILISATEUR WITH FULLSCAN;
UPDATE STATISTICS dbo.FAIT_KPI_ADE WITH FULLSCAN;
UPDATE STATISTICS dbo.DIM_OBJECTIF WITH FULLSCAN;
GO

PRINT '✓ Base de données ADE_KPI créée avec succès !';
PRINT '✓ Tables : DIM_CATEGORIE, DIM_CENTRE, DIM_AGENCE, DIM_COMMUNE, DIM_UTILISATEUR, FAIT_KPI_ADE, DIM_OBJECTIF';
PRINT '✓ Tous les index optimisés ont été créés';
PRINT '✓ Statistiques mises à jour';
PRINT '---------------------------------------------------';
PRINT 'Structure DIM_CENTRE mise à jour avec :';
PRINT '  - NIF : Numéro d''Identification Fiscale';
PRINT '  - NIS : Numéro d''Identification Statistique';
PRINT '  - RC  : Registre du Commerce';
PRINT '  - Telephone2 : Numéro secondaire';
GO