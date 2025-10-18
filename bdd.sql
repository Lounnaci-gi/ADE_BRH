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
    Email NVARCHAR(200) NULL,
    Fax NVARCHAR(50) NULL,
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
    Email NVARCHAR(200) NULL,
    Fax NVARCHAR(50) NULL,
    Nom_Banque NVARCHAR(200) NULL,
    Compte_Bancaire NVARCHAR(100) NULL,
    NIF NVARCHAR(50) NULL,
    NCI NVARCHAR(50) NULL,
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
    DateKPI DATE NOT NULL,
    AgenceId INT NOT NULL,
    CategorieId INT NOT NULL,

    -- Encaissement
    Encaissement_Journalier_Global MONEY NULL,

    -- Coupures
    Nb_Coupures INT NOT NULL DEFAULT 0,
    Mt_Coupures MONEY NOT NULL DEFAULT 0,
    
    -- Rétablissements
    Nb_Retablissements INT NOT NULL DEFAULT 0,
    Mt_Retablissements MONEY NOT NULL DEFAULT 0,
    
    -- Branchements
    Nb_Branchements INT NOT NULL DEFAULT 0,
    Mt_Branchements MONEY NOT NULL DEFAULT 0,
    
    -- Compteurs remplacés
    Nb_Compteurs_Remplaces INT NOT NULL DEFAULT 0,
    Mt_Compteurs_Remplaces MONEY NOT NULL DEFAULT 0,
    
    -- Dossiers juridiques
    Nb_Dossiers_Juridiques INT NOT NULL DEFAULT 0,
    Mt_Dossiers_Juridiques MONEY NOT NULL DEFAULT 0,
    
    -- Contrôles
    Nb_Controles INT NOT NULL DEFAULT 0,
    Mt_Controles MONEY NOT NULL DEFAULT 0,
    
    -- Mises en demeure
    Nb_MisesEnDemeure_Envoyees INT NOT NULL DEFAULT 0,
    Mt_MisesEnDemeure_Envoyees MONEY NOT NULL DEFAULT 0,
    Nb_MisesEnDemeure_Reglees INT NOT NULL DEFAULT 0,
    Mt_MisesEnDemeure_Reglees MONEY NOT NULL DEFAULT 0,
    
    -- Relances
    Nb_RelancesEnvoyees INT NOT NULL DEFAULT 0,
    Mt_RelancesEnvoyees MONEY NOT NULL DEFAULT 0,
    Nb_RelancesReglees INT NOT NULL DEFAULT 0,
    Mt_RelancesReglees MONEY NOT NULL DEFAULT 0,

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
    Obj_Retablissements INT NULL,
    Obj_Branchements INT NULL,
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
  INDEXES NON-CLUSTERED
*******************************************************/

-- Index sur FAIT_KPI_ADE
CREATE NONCLUSTERED INDEX IX_FAIT_DATE_AGENCE
ON dbo.FAIT_KPI_ADE (DateKPI, AgenceId)
INCLUDE (Encaissement_Journalier_Global, Nb_Coupures, Mt_Coupures);
GO

CREATE NONCLUSTERED INDEX IX_FAIT_AGENCE
ON dbo.FAIT_KPI_ADE (AgenceId, DateKPI);
GO

CREATE NONCLUSTERED INDEX IX_FAIT_CATEGORIE
ON dbo.FAIT_KPI_ADE (CategorieId, DateKPI);
GO

-- Index sur relations hiérarchiques
CREATE NONCLUSTERED INDEX IX_COMMUNE_AGENCE
ON dbo.DIM_COMMUNE (FK_Agence);
GO

CREATE NONCLUSTERED INDEX IX_AGENCE_CENTRE
ON dbo.DIM_AGENCE (FK_Centre);
GO

-- Index sur DIM_UTILISATEUR
CREATE NONCLUSTERED INDEX IX_UTILISATEUR_AGENCE
ON dbo.DIM_UTILISATEUR (FK_Agence)
WHERE FK_Agence IS NOT NULL;
GO

-- Index sur DIM_OBJECTIF
CREATE NONCLUSTERED INDEX IX_OBJECTIF_AGENCE_PERIODE
ON dbo.DIM_OBJECTIF (FK_Agence, DateDebut, DateFin, IsActive);
GO

CREATE NONCLUSTERED INDEX IX_OBJECTIF_DATES_ACTIF
ON dbo.DIM_OBJECTIF (DateDebut, DateFin)
WHERE IsActive = 1;
GO