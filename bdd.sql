/*******************************************************
  Création base de données et utilisation
*******************************************************/
IF DB_ID(N'ADE_KPI') IS NULL
BEGIN
    CREATE DATABASE ADE_KPI
    -- Vous pouvez ajouter FILEGROUPS, tamaños, options selon besoin.
END;
GO

USE ADE_KPI;
GO

/*******************************************************
  Schéma (on garde dbo)
*******************************************************/

/*******************************************************
  TABLE: DIM_DATE
  - contient la granularité jour et flags Est_Vendredi, Est_Jour_Ferie
  - sera remplie pour au moins 10 ans (script de peuplement ci-dessous)
*******************************************************/
IF OBJECT_ID('dbo.DIM_DATE') IS NOT NULL DROP TABLE dbo.DIM_DATE;
GO

CREATE TABLE dbo.DIM_DATE
(
    DateKey        INT           NOT NULL PRIMARY KEY, -- format YYYYMMDD (ex: 20251003)
    TheDate        DATE          NOT NULL UNIQUE,
    [Year]         SMALLINT      NOT NULL,
    [Month]        TINYINT       NOT NULL,
    DayOfMonth     TINYINT       NOT NULL,
    DayOfWeek      TINYINT       NOT NULL, -- 1 = Monday .. 7 = Sunday (SQL Server DATEPART dw default depends on DATEFIRST; we will compute 1..7)
    MonthName      NVARCHAR(20)  NOT NULL,
    DayName        NVARCHAR(20)  NOT NULL,
    IsWeekEnd      BIT           NOT NULL, -- Saturday or Sunday
    Est_Vendredi   BIT           NOT NULL, -- flag explicite pour vendredi
    Est_Jour_Ferie BIT           NOT NULL, -- flag pour jours fériés (lié à TAB_JOURS_FERIES)
    IsFirstDayOfMonth BIT        NOT NULL,
    IsLastDayOfMonth  BIT        NOT NULL
);
GO

-- Table des jours fériés déclarés (à alimenter par l'admin)
IF OBJECT_ID('dbo.TAB_JOURS_FERIES') IS NOT NULL DROP TABLE dbo.TAB_JOURS_FERIES;
GO

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
  - 4 catégories requises
*******************************************************/
IF OBJECT_ID('dbo.DIM_CATEGORIE') IS NOT NULL DROP TABLE dbo.DIM_CATEGORIE;
GO

CREATE TABLE dbo.DIM_CATEGORIE
(
    CategorieId INT IDENTITY(1,1) PRIMARY KEY,
    CodeCategorie NVARCHAR(50) NOT NULL UNIQUE,
    Libelle NVARCHAR(100) NOT NULL,
    Description NVARCHAR(250) NULL
);
GO

/*******************************************************
  TABLE: DIM_AGENCE
  - Chaque agence commerciale a un enregistrement unique.
*******************************************************/
IF OBJECT_ID('dbo.DIM_AGENCE') IS NOT NULL DROP TABLE dbo.DIM_AGENCE;
GO

CREATE TABLE dbo.DIM_AGENCE
(
    AgenceId INT IDENTITY(1,1) PRIMARY KEY,
    Nom_Agence NVARCHAR(200) NOT NULL,
    Adresse NVARCHAR(400) NOT NULL,
    Telephone NVARCHAR(50) NOT NULL,
    Email NVARCHAR(200) NULL,
    Fax NVARCHAR(50) NULL,
    Nom_Banque NVARCHAR(200) NULL,
    Compte_Bancaire NVARCHAR(100) NULL,
    NIF NVARCHAR(50) NULL, -- Numéro d'identification fiscale
    NCI NVARCHAR(50) NULL, -- Numéro de compte interne
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_DIM_AGENCE_NOM UNIQUE (Nom_Agence)
);
GO

/*******************************************************
  TABLE: DIM_UTILISATEUR
  - stocke hash mot de passe de manière sécurisée (VARBINARY)
  - FK vers DIM_AGENCE (un utilisateur lié à une agence ; 
    certains utilisateurs administrateur peuvent ne pas être liés)
*******************************************************/
IF OBJECT_ID('dbo.DIM_UTILISATEUR') IS NOT NULL DROP TABLE dbo.DIM_UTILISATEUR;
GO

CREATE TABLE dbo.DIM_UTILISATEUR
(
    UtilisateurId INT IDENTITY(1,1) PRIMARY KEY,
    Nom_Utilisateur NVARCHAR(200) NOT NULL UNIQUE,
    -- Stocker ici le hash sécurisé (application doit générer hash salé via bcrypt / argon2).
    Mot_de_Passe_Hash VARBINARY(128) NOT NULL,
    FK_Agence INT NULL, -- NULL si utilisateur global (admin)
    [Role] NVARCHAR(50) NOT NULL CHECK([Role] IN ('Standard','Administrateur')),
    Email NVARCHAR(200) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_DIM_UTILISATEUR_AGENCE FOREIGN KEY (FK_Agence) REFERENCES dbo.DIM_AGENCE(AgenceId) ON DELETE SET NULL
);
GO

/*******************************************************
  TABLE: FAIT_KPI_ADE
  - Table de faits centrale
  - Une ligne par Date, par Agence, par Categorie
  - Composite PK sur (DateKey, AgenceId, CategorieId) pour assurer unicité
*******************************************************/
IF OBJECT_ID('dbo.FAIT_KPI_ADE') IS NOT NULL DROP TABLE dbo.FAIT_KPI_ADE;
GO

CREATE TABLE dbo.FAIT_KPI_ADE
(
    DateKey      INT NOT NULL, -- FK vers DIM_DATE.DateKey (YYYYMMDD)
    AgenceId     INT NOT NULL, -- FK vers DIM_AGENCE
    CategorieId  INT NOT NULL, -- FK vers DIM_CATEGORIE

    -- Encaissement global pour l'agence ce jour (même si non par catégorie, stocké pour analyse)
    Encaissement_Journalier_Global MONEY NULL,

    /* -------------------
       KPIs: pour chaque élément => Nombre (INT) et Montant (MONEY)
       ------------------- */
    -- Coupures
    Nb_Coupures INT          NOT NULL DEFAULT 0,
    Mt_Coupures MONEY        NOT NULL DEFAULT 0,
    -- Rétablissements
    Nb_Retablissements INT   NOT NULL DEFAULT 0,
    Mt_Retablissements MONEY NOT NULL DEFAULT 0,
    -- Branchements
    Nb_Branchements INT      NOT NULL DEFAULT 0,
    Mt_Branchements MONEY    NOT NULL DEFAULT 0,
    -- Compteurs remplacés
    Nb_Compteurs_Remplaces INT     NOT NULL DEFAULT 0,
    Mt_Compteurs_Remplaces MONEY   NOT NULL DEFAULT 0,
    -- Dossiers juridiques transmis
    Nb_Dossiers_Juridiques INT      NOT NULL DEFAULT 0,
    Mt_Dossiers_Juridiques MONEY    NOT NULL DEFAULT 0,
    -- Contrôles
    Nb_Controles INT         NOT NULL DEFAULT 0,
    Mt_Controles MONEY       NOT NULL DEFAULT 0,
    -- Mises en demeure envoyées
    Nb_MisesEnDemeure_Envoyees INT NOT NULL DEFAULT 0,
    Mt_MisesEnDemeure_Envoyees MONEY NOT NULL DEFAULT 0,
    -- Mises en demeure encaissées / réglées
    Nb_MisesEnDemeure_Reglees INT NOT NULL DEFAULT 0,
    Mt_MisesEnDemeure_Reglees MONEY NOT NULL DEFAULT 0,
    -- Relances systématiques envoyées
    Nb_RelancesEnvoyees INT NOT NULL DEFAULT 0,
    Mt_RelancesEnvoyees MONEY NOT NULL DEFAULT 0,
    -- Relances systématiques encaissées / réglées
    Nb_RelancesReglees INT NOT NULL DEFAULT 0,
    Mt_RelancesReglees MONEY NOT NULL DEFAULT 0,

    /* -------------------
       OBJECTIFS (par agence) : stocker objectif (INT) pour certains KPIs
       ------------------- */
    Obj_Coupures INT NULL,
    Obj_Dossiers_Juridiques INT NULL,
    Obj_MisesEnDemeure_Envoyees INT NULL,
    Obj_Relances_Envoyees INT NULL,

    -- Métadonnées
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedAt DATETIME2 NULL,

    CONSTRAINT PK_FAIT_KPI_ADE PRIMARY KEY CLUSTERED (DateKey, AgenceId, CategorieId),
    CONSTRAINT FK_FAITKPI_DIMDATE FOREIGN KEY (DateKey) REFERENCES dbo.DIM_DATE(DateKey) ON DELETE NO ACTION,
    CONSTRAINT FK_FAITKPI_DIMAGENCE FOREIGN KEY (AgenceId) REFERENCES dbo.DIM_AGENCE(AgenceId) ON DELETE CASCADE,
    CONSTRAINT FK_FAITKPI_DIMCATEGORIE FOREIGN KEY (CategorieId) REFERENCES dbo.DIM_CATEGORIE(CategorieId) ON DELETE NO ACTION
);
GO

/*******************************************************
  INDEXES NON-CLUSTERED utiles pour requêtes analytiques
  - index pour recherche rapide par Agence + DateRange
  - index pour DateKey seul (analyses temporelles)
  - index sur flags Est_Vendredi / Est_Jour_Ferie si besoin (sur DIM_DATE)
*******************************************************/
-- Index sur FAIT pour requêtes par agence + date
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.FAIT_KPI_ADE') AND name = 'IX_FAIT_AGENCE_DATE')
BEGIN
    CREATE NONCLUSTERED INDEX IX_FAIT_AGENCE_DATE
    ON dbo.FAIT_KPI_ADE (AgenceId, DateKey)
    INCLUDE (Encaissement_Journalier_Global, Nb_Coupures, Mt_Coupures);
END;
GO

-- Index pour requêtes par date (utile pour agrégations journalières)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.FAIT_KPI_ADE') AND name = 'IX_FAIT_DATE')
BEGIN
    CREATE NONCLUSTERED INDEX IX_FAIT_DATE
    ON dbo.FAIT_KPI_ADE (DateKey)
    INCLUDE (Encaissement_Journalier_Global);
END;
GO

-- Index pour les objectifs (par agence) si on recherche souvent sur colonnes Objectif
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.FAIT_KPI_ADE') AND name = 'IX_FAIT_OBJ_AGENCE')
BEGIN
    CREATE NONCLUSTERED INDEX IX_FAIT_OBJ_AGENCE
    ON dbo.FAIT_KPI_ADE (AgenceId)
    INCLUDE (Obj_Coupures, Obj_Dossiers_Juridiques, Obj_MisesEnDemeure_Envoyees, Obj_Relances_Envoyees);
END;
GO

-- Indexes sur DIM_DATE pour filtres rapides
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.DIM_DATE') AND name = 'IX_DIM_DATE_YearMonth')
BEGIN
    CREATE NONCLUSTERED INDEX IX_DIM_DATE_YearMonth
    ON dbo.DIM_DATE ([Year], [Month]);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.DIM_DATE') AND name = 'IX_DIM_DATE_Flags')
BEGIN
    CREATE NONCLUSTERED INDEX IX_DIM_DATE_Flags
    ON dbo.DIM_DATE (Est_Vendredi, Est_Jour_Ferie);
END;
GO

/*******************************************************
  Peuplement initial: DIM_CATEGORIE (4 catégories)
*******************************************************/
SET NOCOUNT ON;

IF NOT EXISTS (SELECT 1 FROM dbo.DIM_CATEGORIE WHERE CodeCategorie = 'MENAGE')
BEGIN
    INSERT INTO dbo.DIM_CATEGORIE (CodeCategorie, Libelle, Description)
    VALUES
      ('MENAGE', N'Ménage Individuel', N'Clients ménages individuels'),
      ('ADMIN', N'Administration', N'Clients administrations / collectivités'),
      ('ARTCOM', N'Artisanat / Commercial', N'Clients artisans et commerces'),
      ('IND', N'Industriel', N'Clients industriels');
END;
GO

/*******************************************************
  Exemple: Peuplement de TAB_JOURS_FERIES avec quelques jours fixes
  (Compléter/ajuster par l'administrateur — les fêtes religieuses mobiles
  doivent être ajoutées pour chaque année par l'admin)
*******************************************************/
IF NOT EXISTS (SELECT 1 FROM dbo.TAB_JOURS_FERIES)
BEGIN
    INSERT INTO dbo.TAB_JOURS_FERIES (DateJour, Description) VALUES
      ('2016-01-01','Nouvel An'),
      ('2016-05-01','Fête du Travail'),
      ('2016-07-05','Fête de l\'Indépendance'),
      ('2016-11-01','Fête de la Révolution');

    -- Note: ce sont des exemples ; l'admin doit insérer les dates pertinentes pour chaque année.
END;
GO

/*******************************************************
  Peuplement automatique de DIM_DATE sur 10 ans.
  Ici on génère de 2016-01-01 à 2025-12-31 (10 ans).
  Ajustez les bornes si nécessaire.
*******************************************************/
DECLARE @start DATE = '2016-01-01';
DECLARE @end   DATE = '2025-12-31'; -- au moins 10 ans
DECLARE @d DATE = @start;

WHILE @d <= @end
BEGIN
    DECLARE @dk INT = CONVERT(INT, FORMAT(@d,'yyyyMMdd'));
    DECLARE @dow INT = DATEPART(WEEKDAY, @d); -- 1..7 selon DATEFIRST, but we will remap to ISO-style (1=Mon..7=Sun)
    -- Remapper DAYOFWEEK en 1=Monday .. 7=Sunday indépendamment de DATEFIRST
    DECLARE @isoDow TINYINT = ((DATEPART(WEEKDAY, @d) + @@DATEFIRST - 2) % 7) + 1;

    INSERT INTO dbo.DIM_DATE (DateKey, TheDate, [Year], [Month], DayOfMonth, DayOfWeek, MonthName, DayName, IsWeekEnd, Est_Vendredi, Est_Jour_Ferie, IsFirstDayOfMonth, IsLastDayOfMonth)
    SELECT
        @dk,
        @d,
        DATEPART(YEAR,@d),
        DATEPART(MONTH,@d),
        DATEPART(DAY,@d),
        @isoDow,
        DATENAME(MONTH,@d),
        DATENAME(WEEKDAY,@d),
        CASE WHEN @isoDow IN (6,7) THEN 1 ELSE 0 END, -- 6=Saturday, 7=Sunday
        CASE WHEN DATENAME(WEEKDAY,@d) = 'Friday' OR (DATEPART(WEEKDAY,@d) + @@DATEFIRST - 2) % 7 + 1 = 5 THEN 1 ELSE 0 END,
        CASE WHEN EXISTS (SELECT 1 FROM dbo.TAB_JOURS_FERIES f WHERE f.DateJour = @d) THEN 1 ELSE 0 END,
        CASE WHEN DAY(@d) = 1 THEN 1 ELSE 0 END,
        CASE WHEN @d = EOMONTH(@d) THEN 1 ELSE 0 END
    WHERE NOT EXISTS (SELECT 1 FROM dbo.DIM_DATE dd WHERE dd.DateKey = @dk);

    SET @d = DATEADD(DAY,1,@d);
END;
GO

/*******************************************************
  INDEXS SUPPLÉMENTAIRES & VUES UTILES (exemples)
*******************************************************/
-- Vue d'aide: agrégation journalière par agence (exemple)
IF OBJECT_ID('dbo.VW_FAIT_AGENCE_JOUR') IS NOT NULL DROP VIEW dbo.VW_FAIT_AGENCE_JOUR;
GO
CREATE VIEW dbo.VW_FAIT_AGENCE_JOUR
AS
SELECT
    f.DateKey,
    d.TheDate,
    f.AgenceId,
    a.Nom_Agence,
    SUM(f.Encaissement_Journalier_Global) AS TotalEncaissementAgence, -- si plusieurs catégories, somme (mais stocké aussi au niveau ligne)
    SUM(f.Nb_Coupures) AS Nb_Coupures,
    SUM(f.Mt_Coupures) AS Mt_Coupures,
    SUM(f.Nb_Retablissements) AS Nb_Retablissements
FROM dbo.FAIT_KPI_ADE f
JOIN dbo.DIM_DATE d ON f.DateKey = d.DateKey
JOIN dbo.DIM_AGENCE a ON f.AgenceId = a.AgenceId
GROUP BY f.DateKey, d.TheDate, f.AgenceId, a.Nom_Agence;
GO

/*******************************************************
  Remarques & bonnes pratiques / Commentaires pour l'application
  (Règles demandées dans la spécification)
*******************************************************/

/*
  LOGIQUE D'APPLICATION (à implémenter côté front-end/back-end) :

  1) Modification Standard :
     - Un utilisateur avec Role = 'Standard' et qui est lié à une agence (DIM_UTILISATEUR.FK_Agence)
       peut modifier les lignes de FAIT_KPI_ADE uniquement si la DateKey correspond à la date du jour
       OU si la DateKey est dans un intervalle de 5 jours immédiatement antérieurs à la date actuelle.
       Exemple (pseudo) :
         currentDateKey = CONVERT(INT, FORMAT(GETDATE(), 'yyyyMMdd'));
         autorisé_si DateKey BETWEEN (currentDateKey - 5 jours) AND currentDateKey

     - Toute ligne dont DateKey < (date du jour - 5 jours) doit être en lecture seule (verrouillage côté application).
       IMPORTANT : la restriction doit être appliquée côté back-end pour sécurité (vérification serveur avant mise à jour).
       Le front-end ne doit seulement afficher les boutons d'édition si la règle est satisfaite.

  2) Rôle Administrateur :
     - Un utilisateur avec Role = 'Administrateur' a droits illimités de modification sur FAIT_KPI_ADE,
       et peut créer/modifier/supprimer en plus les enregistrements de DIM_AGENCE et DIM_UTILISATEUR.
     - Les droits admin doivent être gérés par un module d'authentification/autorisation dans l'API (RBAC).
  
  3) Recommandation d'implémentation :
     - Le back-end (API) doit vérifier le rôle et l'appartenance à l'agence avant toute UPDATE/DELETE/INSERT sur FAIT_KPI_ADE.
     - Les contrôles doivent être double : UI (expérience utilisateur) + Server (sécurité).
     - Exemple de contrôle côté serveur (pseudo) :
         IF @UserRole = 'Standard'
           AND @UserAgenceId = @AgenceId_of_row
           AND @DateKey >= CONVERT(INT, FORMAT(DATEADD(DAY,-5,GETDATE()), 'yyyyMMdd'))
           AND @DateKey <= CONVERT(INT, FORMAT(GETDATE(), 'yyyyMMdd'))
         THEN allow update
         ELSE deny update

  4) Gestion des jours fériés (Est_Jour_Ferie) :
     - L'administrateur doit remplir/maintenir la table TAB_JOURS_FERIES pour marquer correctement les jours fériés mobiles
       (ex : Eid, etc.). Le flag Est_Jour_Ferie dans DIM_DATE est calculé au moment du (re)peuplement à partir de cette table.
     - Si vous avez des règles business particulières sur l'autorisation d'édition pour un jour férié,
       implémentez-les de la même manière (UI + validation back-end).

  5) Stockage des mots de passe :
     - Ne jamais stocker de mot de passe en clair.
     - L'application doit générer un hash salé sécurisé (bcrypt ou argon2id fortement recommandé).
     - Stocker le hash (et éventuellement le sel) dans DIM_UTILISATEUR.Mot_de_Passe_Hash (VARBINARY).
     - Exemple : bcrypt renvoie une chaîne de ~60 caractères ; vous pouvez stocker l'octet encodé en VARBINARY.

  6) Historique / Audit (optionnel mais recommandé) :
     - Pour traçabilité, ajouter un mécanisme d'audit (ex: table FAIT_KPI_ADE_AUDIT) pour enregistrer qui a modifié quoi et quand.
     - Alternativement créer triggers AFTER UPDATE/INSERT/DELETE pour insérer dans une table d'audit.

*/

/*******************************************************
  Exemple d'insertion d'agence et d'utilisateur (exemples)
  (Remplacer par données réelles)
*******************************************************/
INSERT INTO dbo.DIM_AGENCE (Nom_Agence, Adresse, Telephone, Email, Nom_Banque, Compte_Bancaire, NIF, NCI)
VALUES (N'Agence Exemple Béjaïa', N'Rue Exemple, Béjaïa', '+213-XX-XXX-XXXX', 'agence@example.ad', 'FR76 1234 5678 9012 3456 7890', 'NIF123456', 'NCI7890');

-- Exemple: création utilisateur admin (mot de passe doit être hashé par l'application)
-- Note: ici on met un exemple binaire fictif. En production, insérer via l'API avec hash réel.
INSERT INTO dbo.DIM_UTILISATEUR (Nom_Utilisateur, Mot_de_Passe_Hash, FK_Agence, [Role], Email)
VALUES (N'admin', 0x53414D504C4548415348, NULL, 'Administrateur', 'admin@ade.local');

GO

/*******************************************************
  FIN DU SCRIPT
*******************************************************/
SET NOCOUNT OFF;
