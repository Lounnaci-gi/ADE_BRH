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

-- Supprimer les vues d'abord
IF OBJECT_ID('dbo.VW_SUIVI_OBJECTIFS_MENSUEL') IS NOT NULL DROP VIEW dbo.VW_SUIVI_OBJECTIFS_MENSUEL;
IF OBJECT_ID('dbo.VW_HIERARCHIE_COMPLETE') IS NOT NULL DROP VIEW dbo.VW_HIERARCHIE_COMPLETE;
IF OBJECT_ID('dbo.VW_STATISTIQUES_CENTRE') IS NOT NULL DROP VIEW dbo.VW_STATISTIQUES_CENTRE;
IF OBJECT_ID('dbo.VW_COMMUNES_PAR_AGENCE') IS NOT NULL DROP VIEW dbo.VW_COMMUNES_PAR_AGENCE;
IF OBJECT_ID('dbo.VW_FAIT_AGENCE_JOUR') IS NOT NULL DROP VIEW dbo.VW_FAIT_AGENCE_JOUR;
GO

-- Supprimer les tables dans l'ordre inverse des dépendances
IF OBJECT_ID('dbo.DIM_OBJECTIF') IS NOT NULL DROP TABLE dbo.DIM_OBJECTIF;
IF OBJECT_ID('dbo.FAIT_KPI_ADE') IS NOT NULL DROP TABLE dbo.FAIT_KPI_ADE;
IF OBJECT_ID('dbo.DIM_UTILISATEUR') IS NOT NULL DROP TABLE dbo.DIM_UTILISATEUR;
IF OBJECT_ID('dbo.DIM_COMMUNE') IS NOT NULL DROP TABLE dbo.DIM_COMMUNE;
IF OBJECT_ID('dbo.DIM_AGENCE') IS NOT NULL DROP TABLE dbo.DIM_AGENCE;
IF OBJECT_ID('dbo.DIM_CENTRE') IS NOT NULL DROP TABLE dbo.DIM_CENTRE;
IF OBJECT_ID('dbo.DIM_CATEGORIE') IS NOT NULL DROP TABLE dbo.DIM_CATEGORIE;
IF OBJECT_ID('dbo.TAB_JOURS_FERIES') IS NOT NULL DROP TABLE dbo.TAB_JOURS_FERIES;
IF OBJECT_ID('dbo.DIM_DATE') IS NOT NULL DROP TABLE dbo.DIM_DATE;
GO

/*******************************************************
  TABLE: DIM_DATE
*******************************************************/
CREATE TABLE dbo.DIM_DATE
(
    DateKey        INT           NOT NULL PRIMARY KEY,
    TheDate        DATE          NOT NULL UNIQUE,
    [Year]         SMALLINT      NOT NULL,
    [Month]        TINYINT       NOT NULL,
    DayOfMonth     TINYINT       NOT NULL,
    DayOfWeek      TINYINT       NOT NULL,
    MonthName      NVARCHAR(20)  NOT NULL,
    DayName        NVARCHAR(20)  NOT NULL,
    IsWeekEnd      BIT           NOT NULL,
    Est_Vendredi   BIT           NOT NULL,
    Est_Jour_Ferie BIT           NOT NULL,
    IsFirstDayOfMonth BIT        NOT NULL,
    IsLastDayOfMonth  BIT        NOT NULL
);
GO

/*******************************************************
  TABLE: TAB_JOURS_FERIES
*******************************************************/
CREATE TABLE dbo.TAB_JOURS_FERIES
(
    JourFerieId INT IDENTITY(1,1) PRIMARY KEY,
    DateJour DATE NOT NULL UNIQUE,
    Description NVARCHAR(200) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/*******************************************************
  TABLE: DIM_CATEGORIE
*******************************************************/
CREATE TABLE dbo.DIM_CATEGORIE
(
    CategorieId INT IDENTITY(1,1) PRIMARY KEY,
    CodeCategorie NVARCHAR(50) NOT NULL UNIQUE,
    Libelle NVARCHAR(100) NOT NULL,
    Description NVARCHAR(250) NULL
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
    DateKey      INT NOT NULL,
    AgenceId     INT NOT NULL,
    CategorieId  INT NOT NULL,

    Encaissement_Journalier_Global MONEY NULL,

    Nb_Coupures INT          NOT NULL DEFAULT 0,
    Mt_Coupures MONEY        NOT NULL DEFAULT 0,
    Nb_Retablissements INT   NOT NULL DEFAULT 0,
    Mt_Retablissements MONEY NOT NULL DEFAULT 0,
    Nb_Branchements INT      NOT NULL DEFAULT 0,
    Mt_Branchements MONEY    NOT NULL DEFAULT 0,
    Nb_Compteurs_Remplaces INT     NOT NULL DEFAULT 0,
    Mt_Compteurs_Remplaces MONEY   NOT NULL DEFAULT 0,
    Nb_Dossiers_Juridiques INT      NOT NULL DEFAULT 0,
    Mt_Dossiers_Juridiques MONEY    NOT NULL DEFAULT 0,
    Nb_Controles INT         NOT NULL DEFAULT 0,
    Mt_Controles MONEY       NOT NULL DEFAULT 0,
    Nb_MisesEnDemeure_Envoyees INT NOT NULL DEFAULT 0,
    Mt_MisesEnDemeure_Envoyees MONEY NOT NULL DEFAULT 0,
    Nb_MisesEnDemeure_Reglees INT NOT NULL DEFAULT 0,
    Mt_MisesEnDemeure_Reglees MONEY NOT NULL DEFAULT 0,
    Nb_RelancesEnvoyees INT NOT NULL DEFAULT 0,
    Mt_RelancesEnvoyees MONEY NOT NULL DEFAULT 0,
    Nb_RelancesReglees INT NOT NULL DEFAULT 0,
    Mt_RelancesReglees MONEY NOT NULL DEFAULT 0,

    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedAt DATETIME2 NULL,

    CONSTRAINT PK_FAIT_KPI_ADE PRIMARY KEY CLUSTERED (DateKey, AgenceId, CategorieId),
    CONSTRAINT FK_FAITKPI_DIMDATE FOREIGN KEY (DateKey) 
        REFERENCES dbo.DIM_DATE(DateKey) ON DELETE NO ACTION,
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
    FK_Categorie INT NULL, -- NULL = objectif global pour toutes catégories
    
    -- Période de validité
    DateDebut DATE NOT NULL,
    DateFin DATE NOT NULL,
    
    -- Type d'objectif (mensuel, trimestriel, annuel)
    TypePeriode NVARCHAR(20) NOT NULL 
        CHECK(TypePeriode IN ('Mensuel','Trimestriel','Annuel','Personnalise')),
    
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
    
    -- Notes et commentaires
    Commentaire NVARCHAR(500) NULL,
    
    -- Suivi
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy INT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedBy INT NULL,
    ModifiedAt DATETIME2 NULL,
    
    CONSTRAINT FK_OBJECTIF_AGENCE FOREIGN KEY (FK_Agence) 
        REFERENCES dbo.DIM_AGENCE(AgenceId) ON DELETE CASCADE,
    CONSTRAINT FK_OBJECTIF_CATEGORIE FOREIGN KEY (FK_Categorie) 
        REFERENCES dbo.DIM_CATEGORIE(CategorieId) ON DELETE CASCADE,
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
CREATE NONCLUSTERED INDEX IX_FAIT_AGENCE_DATE
ON dbo.FAIT_KPI_ADE (AgenceId, DateKey)
INCLUDE (Encaissement_Journalier_Global, Nb_Coupures, Mt_Coupures);
GO

CREATE NONCLUSTERED INDEX IX_FAIT_DATE
ON dbo.FAIT_KPI_ADE (DateKey)
INCLUDE (Encaissement_Journalier_Global);
GO

CREATE NONCLUSTERED INDEX IX_FAIT_CATEGORIE
ON dbo.FAIT_KPI_ADE (CategorieId, DateKey);
GO

-- Index sur DIM_DATE
CREATE NONCLUSTERED INDEX IX_DIM_DATE_YearMonth
ON dbo.DIM_DATE ([Year], [Month]);
GO

CREATE NONCLUSTERED INDEX IX_DIM_DATE_Flags
ON dbo.DIM_DATE (Est_Vendredi, Est_Jour_Ferie);
GO

-- Index sur relations hiérarchiques
CREATE NONCLUSTERED INDEX IX_COMMUNE_AGENCE
ON dbo.DIM_COMMUNE (FK_Agence);
GO

CREATE NONCLUSTERED INDEX IX_AGENCE_CENTRE
ON dbo.DIM_AGENCE (FK_Centre);
GO

-- Index sur DIM_OBJECTIF
CREATE NONCLUSTERED INDEX IX_OBJECTIF_AGENCE_PERIODE
ON dbo.DIM_OBJECTIF (FK_Agence, DateDebut, DateFin, IsActive);
GO

CREATE NONCLUSTERED INDEX IX_OBJECTIF_DATES_ACTIF
ON dbo.DIM_OBJECTIF (DateDebut, DateFin)
WHERE IsActive = 1;
GO

CREATE NONCLUSTERED INDEX IX_OBJECTIF_CATEGORIE
ON dbo.DIM_OBJECTIF (FK_Categorie)
WHERE FK_Categorie IS NOT NULL;
GO

