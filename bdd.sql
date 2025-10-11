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
IF OBJECT_ID('dbo.VW_HIERARCHIE_COMPLETE') IS NOT NULL DROP VIEW dbo.VW_HIERARCHIE_COMPLETE;
IF OBJECT_ID('dbo.VW_STATISTIQUES_CENTRE') IS NOT NULL DROP VIEW dbo.VW_STATISTIQUES_CENTRE;
IF OBJECT_ID('dbo.VW_COMMUNES_PAR_AGENCE') IS NOT NULL DROP VIEW dbo.VW_COMMUNES_PAR_AGENCE;
IF OBJECT_ID('dbo.VW_FAIT_AGENCE_JOUR') IS NOT NULL DROP VIEW dbo.VW_FAIT_AGENCE_JOUR;
GO

-- Supprimer les tables dans l'ordre inverse des dépendances
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

    Obj_Coupures INT NULL,
    Obj_Dossiers_Juridiques INT NULL,
    Obj_MisesEnDemeure_Envoyees INT NULL,
    Obj_Relances_Envoyees INT NULL,

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
  INDEXES NON-CLUSTERED
*******************************************************/
CREATE NONCLUSTERED INDEX IX_FAIT_AGENCE_DATE
ON dbo.FAIT_KPI_ADE (AgenceId, DateKey)
INCLUDE (Encaissement_Journalier_Global, Nb_Coupures, Mt_Coupures);
GO

CREATE NONCLUSTERED INDEX IX_FAIT_DATE
ON dbo.FAIT_KPI_ADE (DateKey)
INCLUDE (Encaissement_Journalier_Global);
GO

CREATE NONCLUSTERED INDEX IX_FAIT_OBJ_AGENCE
ON dbo.FAIT_KPI_ADE (AgenceId)
INCLUDE (Obj_Coupures, Obj_Dossiers_Juridiques, Obj_MisesEnDemeure_Envoyees, Obj_Relances_Envoyees);
GO

CREATE NONCLUSTERED INDEX IX_DIM_DATE_YearMonth
ON dbo.DIM_DATE ([Year], [Month]);
GO

CREATE NONCLUSTERED INDEX IX_DIM_DATE_Flags
ON dbo.DIM_DATE (Est_Vendredi, Est_Jour_Ferie);
GO

CREATE NONCLUSTERED INDEX IX_COMMUNE_AGENCE
ON dbo.DIM_COMMUNE (FK_Agence);
GO

CREATE NONCLUSTERED INDEX IX_AGENCE_CENTRE
ON dbo.DIM_AGENCE (FK_Centre);
GO

/*******************************************************
  PEUPLEMENTS INITIAUX
*******************************************************/
SET NOCOUNT ON;

-- DIM_CATEGORIE
INSERT INTO dbo.DIM_CATEGORIE (CodeCategorie, Libelle, Description)
VALUES
  ('MENAGE', N'Ménage Individuel', N'Clients ménages individuels'),
  ('ADMIN', N'Administration', N'Clients administrations / collectivités'),
  ('ARTCOM', N'Artisanat / Commercial', N'Clients artisans et commerces'),
  ('IND', N'Industriel', N'Clients industriels');
GO

-- TAB_JOURS_FERIES
INSERT INTO dbo.TAB_JOURS_FERIES (DateJour, Description) VALUES
  ('2016-01-01','Nouvel An'),
  ('2016-05-01','Fête du Travail'),
  ('2016-07-05','Fête de l''Indépendance'),
  ('2016-11-01','Fête de la Révolution'),
  ('2024-01-01','Nouvel An 2024'),
  ('2024-05-01','Fête du Travail 2024'),
  ('2024-07-05','Fête de l''Indépendance 2024'),
  ('2024-11-01','Fête de la Révolution 2024'),
  ('2025-01-01','Nouvel An 2025'),
  ('2025-05-01','Fête du Travail 2025'),
  ('2025-07-05','Fête de l''Indépendance 2025'),
  ('2025-11-01','Fête de la Révolution 2025');
GO

-- DIM_DATE (Peuplement sur 10 ans)
DECLARE @start DATE = '2016-01-01';
DECLARE @end   DATE = '2025-12-31';
DECLARE @d DATE = @start;

WHILE @d <= @end
BEGIN
    DECLARE @dk INT = CONVERT(INT, FORMAT(@d,'yyyyMMdd'));
    DECLARE @isoDow TINYINT = ((DATEPART(WEEKDAY, @d) + @@DATEFIRST - 2) % 7) + 1;

    INSERT INTO dbo.DIM_DATE (DateKey, TheDate, [Year], [Month], DayOfMonth, DayOfWeek, MonthName, DayName, IsWeekEnd, Est_Vendredi, Est_Jour_Ferie, IsFirstDayOfMonth, IsLastDayOfMonth)
    VALUES (
        @dk,
        @d,
        YEAR(@d),
        MONTH(@d),
        DAY(@d),
        @isoDow,
        DATENAME(MONTH,@d),
        DATENAME(WEEKDAY,@d),
        CASE WHEN @isoDow IN (6,7) THEN 1 ELSE 0 END,
        CASE WHEN @isoDow = 5 THEN 1 ELSE 0 END,
        CASE WHEN EXISTS (SELECT 1 FROM dbo.TAB_JOURS_FERIES f WHERE f.DateJour = @d) THEN 1 ELSE 0 END,
        CASE WHEN DAY(@d) = 1 THEN 1 ELSE 0 END,
        CASE WHEN @d = EOMONTH(@d) THEN 1 ELSE 0 END
    );

    SET @d = DATEADD(DAY,1,@d);
END;
GO

/*******************************************************
  VUES UTILES
*******************************************************/

-- Vue: agrégation journalière par agence avec informations du centre
CREATE VIEW dbo.VW_FAIT_AGENCE_JOUR
AS
SELECT
    f.DateKey,
    d.TheDate,
    f.AgenceId,
    a.Nom_Agence,
    c.CentreId,
    c.Nom_Centre,
    SUM(f.Encaissement_Journalier_Global) AS TotalEncaissementAgence,
    SUM(f.Nb_Coupures) AS Nb_Coupures,
    SUM(f.Mt_Coupures) AS Mt_Coupures,
    SUM(f.Nb_Retablissements) AS Nb_Retablissements,
    SUM(f.Mt_Retablissements) AS Mt_Retablissements
FROM dbo.FAIT_KPI_ADE f
JOIN dbo.DIM_DATE d ON f.DateKey = d.DateKey
JOIN dbo.DIM_AGENCE a ON f.AgenceId = a.AgenceId
JOIN dbo.DIM_CENTRE c ON a.FK_Centre = c.CentreId
GROUP BY f.DateKey, d.TheDate, f.AgenceId, a.Nom_Agence, c.CentreId, c.Nom_Centre;
GO

-- Vue: Liste des communes par agence et centre
CREATE VIEW dbo.VW_COMMUNES_PAR_AGENCE
AS
SELECT
    c.CentreId,
    c.Nom_Centre,
    a.AgenceId,
    a.Nom_Agence,
    com.CommuneId,
    com.Nom_Commune
FROM dbo.DIM_CENTRE c
JOIN dbo.DIM_AGENCE a ON c.CentreId = a.FK_Centre
LEFT JOIN dbo.DIM_COMMUNE com ON a.AgenceId = com.FK_Agence;
GO

-- Vue: Statistiques par centre
CREATE VIEW dbo.VW_STATISTIQUES_CENTRE
AS
SELECT
    c.CentreId,
    c.Nom_Centre,
    c.Adresse AS Adresse_Centre,
    c.Telephone AS Tel_Centre,
    c.Email AS Email_Centre,
    COUNT(DISTINCT a.AgenceId) AS Nb_Agences,
    COUNT(DISTINCT com.CommuneId) AS Nb_Communes_Total
FROM dbo.DIM_CENTRE c
LEFT JOIN dbo.DIM_AGENCE a ON c.CentreId = a.FK_Centre
LEFT JOIN dbo.DIM_COMMUNE com ON a.AgenceId = com.FK_Agence
GROUP BY c.CentreId, c.Nom_Centre, c.Adresse, c.Telephone, c.Email;
GO

-- Vue: Hiérarchie complète Centre > Agence > Commune
CREATE VIEW dbo.VW_HIERARCHIE_COMPLETE
AS
SELECT
    c.CentreId,
    c.Nom_Centre,
    c.Adresse AS Adresse_Centre,
    c.Telephone AS Tel_Centre,
    a.AgenceId,
    a.Nom_Agence,
    a.Adresse AS Adresse_Agence,
    a.Telephone AS Tel_Agence,
    com.CommuneId,
    com.Nom_Commune
FROM dbo.DIM_CENTRE c
LEFT JOIN dbo.DIM_AGENCE a ON c.CentreId = a.FK_Centre
LEFT JOIN dbo.DIM_COMMUNE com ON a.AgenceId = com.FK_Agence;
GO

/*******************************************************
  DONNÉES EXEMPLES
*******************************************************/

-- Insertion d'un centre exemple
INSERT INTO dbo.DIM_CENTRE (Nom_Centre, Adresse, Telephone, Email, Fax)
VALUES (N'Centre Régional Béjaïa', N'Avenue de la Liberté, Béjaïa', '+213-34-210-XXX', 'centre.bejaia@ade.dz', '+213-34-210-XXX');

DECLARE @CentreId INT = SCOPE_IDENTITY();

-- Insertion d'une agence liée au centre
INSERT INTO dbo.DIM_AGENCE (FK_Centre, Nom_Agence, Adresse, Telephone, Email, Nom_Banque, Compte_Bancaire, NIF, NCI)
VALUES (@CentreId, N'Agence Exemple Béjaïa', N'Rue Exemple, Béjaïa', '+213-34-XXX-XXX', 'agence.bejaia@ade.dz', 'BNA', 'FR76 1234 5678 9012 3456 7890', 'NIF123456', 'NCI7890');

DECLARE @AgenceId INT = SCOPE_IDENTITY();

-- Insertion de communes pour l'agence
INSERT INTO dbo.DIM_COMMUNE (FK_Agence, Nom_Commune)
VALUES 
    (@AgenceId, N'Béjaïa Centre'),
    (@AgenceId, N'Amizour'),
    (@AgenceId, N'Akbou'),
    (@AgenceId, N'Sidi Aich'),
    (@AgenceId, N'El Kseur');

-- Insertion d'un utilisateur admin avec téléphone
INSERT INTO dbo.DIM_UTILISATEUR (Nom_Utilisateur, Mot_de_Passe_Hash, FK_Agence, [Role], Email, Telephone)
VALUES (N'admin', 0x53414D504C4548415348, NULL, 'Administrateur', 'admin@ade.dz', '+213-XX-XXX-XXXX');

-- Insertion d'un utilisateur standard lié à l'agence
INSERT INTO dbo.DIM_UTILISATEUR (Nom_Utilisateur, Mot_de_Passe_Hash, FK_Agence, [Role], Email, Telephone)
VALUES (N'user_bejaia', 0x53414D504C4548415348, @AgenceId, 'Standard', 'user.bejaia@ade.dz', '+213-34-XXX-XXXX');

GO

/*******************************************************
  RÈGLES DE GESTION ET BONNES PRATIQUES
*******************************************************/
/*
  STRUCTURE HIÉRARCHIQUE:
  DIM_CENTRE (1) ──→ (1..N) DIM_AGENCE (1) ──→ (0..N) DIM_COMMUNE

  LOGIQUE D'APPLICATION:
  
  1) Modification Standard (utilisateurs avec Role='Standard'):
     - Peut modifier FAIT_KPI_ADE uniquement pour:
       * DateKey = date du jour
       * OU DateKey dans les 5 jours précédents
     - Contrôle OBLIGATOIRE côté back-end avant toute mise à jour
  
  2) Rôle Administrateur:
     - Droits illimités sur toutes les tables
     - Peut gérer DIM_CENTRE, DIM_AGENCE, DIM_COMMUNE, DIM_UTILISATEUR
  
  3) Sécurité mots de passe:
     - TOUJOURS utiliser bcrypt ou argon2id
     - JAMAIS stocker en clair
     - Hash stocké dans Mot_de_Passe_Hash (VARBINARY)
  
  4) Cascades:
     - Suppression agence → suppression communes (CASCADE)
     - Suppression centre → bloquée si agences existent (NO ACTION)
     - Suppression agence → FK_Agence utilisateur devient NULL (SET NULL)
*/

SET NOCOUNT OFF;
PRINT 'Base de données ADE_KPI créée avec succès !';
PRINT 'Tables créées: DIM_DATE, DIM_CATEGORIE, DIM_CENTRE, DIM_AGENCE, DIM_COMMUNE, DIM_UTILISATEUR, FAIT_KPI_ADE';
PRINT 'Vues créées: VW_FAIT_AGENCE_JOUR, VW_COMMUNES_PAR_AGENCE, VW_STATISTIQUES_CENTRE, VW_HIERARCHIE_COMPLETE';
GO