-- S'assurer d'utiliser la bonne base de données
USE ADE_KPI;
GO

-------------------------------------------------------
-- DÉCLARATION DES VARIABLES DE TABLE POUR GÉRER LES IDs
-------------------------------------------------------
DECLARE @InsertedCategories TABLE (CategorieId INT, CodeCategorie NVARCHAR(50));
DECLARE @InsertedCentres TABLE (CentreId INT, Nom_Centre NVARCHAR(200));
DECLARE @InsertedAgences TABLE (AgenceId INT, Nom_Agence NVARCHAR(200));

-------------------------------------------------------
-- 1. INSERTION DES CATÉGORIES (4 Catégories)
-------------------------------------------------------
PRINT '--- 1. Insertion des 4 Catégories de clients ---';

INSERT INTO dbo.DIM_CATEGORIE (CodeCategorie, Libelle, Description)
OUTPUT inserted.CategorieId, inserted.CodeCategorie INTO @InsertedCategories (CategorieId, CodeCategorie)
VALUES
    ('CATI', 'Ménage Individuel', 'Clients Particuliers résidentiels (Faible Consommation)'),
    ('CATII', 'Administration / Public', 'Collectivités, organismes publics (Gros Consommateurs, Régulateurs)'),
    ('CATIII', 'Artisanat / Commercial', 'PME, Commerces et Services (Fiabilité Critique pour l''activité)'),
    ('CATIV', 'Industriels', 'Grandes Entreprises de production (Très Gros Consommateurs, Besoins techniques)');

-------------------------------------------------------
-- 2. INSERTION DES CENTRES (5 Centres)
-------------------------------------------------------
PRINT '--- 2. Insertion des 5 Centres (Médéa, Berrouaghia, Ksar Boukhari, etc.) ---';

INSERT INTO dbo.DIM_CENTRE (Nom_Centre, Adresse, Telephone, Telephone2, Email, Nom_Banque, Compte_Bancaire, NIF, NIS, RC)
OUTPUT inserted.CentreId, inserted.Nom_Centre INTO @InsertedCentres (CentreId, Nom_Centre)
VALUES
    ('Medea', '10 Rue de la Liberté, Medea', '025-50-10-00', '055-00-10-01', 'medea.centre@ade.dz', 'BNA', '00100203040506001', '000010000000001', '5001', 'RC0001'),
    ('Berrouaghia', 'Zone Industrielle, Berrouaghia', '025-50-20-00', '055-00-20-02', 'berrouaghia.centre@ade.dz', 'CPA', '00100203040506002', '000010000000002', '5002', 'RC0002'),
    ('Ksar Boukhari', 'Centre-Ville, Ksar Boukhari', '025-50-30-00', '055-00-30-03', 'ksarboukhari.centre@ade.dz', 'BDL', '00100203040506003', '000010000000003', '5003', 'RC0003'),
    ('Beni Slimane', 'Quartier Administratif, Beni Slimane', '025-50-40-00', '055-00-40-04', 'benislimane.centre@ade.dz', 'AGB', '00100203040506004', '000010000000004', '5004', 'RC0004'),
    ('Si El Mahdjoub', 'Rond-Point 05, Si El Mahdjoub', '025-50-50-00', '055-00-50-05', 'sielmahdjoub.centre@ade.dz', 'BCE', '00100203040506005', '000010000000005', '5005', 'RC0005');

-------------------------------------------------------
-- 3. INSERTION DES AGENCES (10 Agences)
-------------------------------------------------------
PRINT '--- 3. Insertion des 10 Agences (réparties sur les centres) ---';

INSERT INTO dbo.DIM_AGENCE (FK_Centre, Nom_Agence, Adresse, Telephone, Telephone2, Email, Fax)
OUTPUT inserted.AgenceId, inserted.Nom_Agence INTO @InsertedAgences (AgenceId, Nom_Agence)
SELECT
    C.CentreId,
    A.Nom_Agence,
    A.Adresse,
    A.Telephone,
    A.Telephone2,
    A.Email,
    A.Fax
FROM (
    -- Medea (3 agences)
    SELECT 'TahTouh' AS Nom_Agence, 'Cité TahTouh, Medea' AS Adresse, '025-50-11-11' AS Telephone, '055-00-11-12' AS Telephone2, 'ag.tahtouh@ade.dz' AS Email, NULL AS Fax, 'Medea' AS Centre
    UNION ALL SELECT '24Février', 'Avenue du 24 Février, Medea', '025-50-11-21', '055-00-11-22', 'ag.24fev@ade.dz', NULL, 'Medea'
    UNION ALL SELECT 'Ouzra', 'Route de Ouzra, Medea', '025-50-11-31', '055-00-11-32', 'ag.ouzra@ade.dz', NULL, 'Medea'
    
    -- Berrouaghia (2 agences)
    UNION ALL SELECT 'Berrouaghia Ville', 'Rue Principale, Berrouaghia', '025-50-21-11', '055-00-21-12', 'ag.berro@ade.dz', NULL, 'Berrouaghia'
    UNION ALL SELECT 'Sidi Merabet', 'Quartier Sidi Merabet, Berrouaghia', '025-50-21-21', '055-00-21-22', 'ag.sidi@ade.dz', NULL, 'Berrouaghia'
    
    -- Ksar Boukhari (2 agences)
    UNION ALL SELECT 'Ksar Centre', 'Place Centrale, Ksar Boukhari', '025-50-31-11', '055-00-31-12', 'ag.ksar@ade.dz', NULL, 'Ksar Boukhari'
    UNION ALL SELECT 'Ouled Hellal', 'RN1, Ouled Hellal', '025-50-31-21', '055-00-31-22', 'ag.ouled@ade.dz', NULL, 'Ksar Boukhari'

    -- Beni Slimane (2 agences)
    UNION ALL SELECT 'Beni Slimane Nord', 'Rond-Point Nord, Beni Slimane', '025-50-41-11', '055-00-41-12', 'ag.benisl@ade.dz', NULL, 'Beni Slimane'
    UNION ALL SELECT 'Aziz', 'Centre-Ville, Aziz', '025-50-41-21', '055-00-41-22', 'ag.aziz@ade.dz', NULL, 'Beni Slimane'

    -- Si El Mahdjoub (1 agence)
    UNION ALL SELECT 'Si El Mahdjoub', 'Rue des Martyrs, Si El Mahdjoub', '025-50-51-11', '055-00-51-12', 'ag.sielmahdjoub@ade.dz', NULL, 'Si El Mahdjoub'
) AS A
JOIN @InsertedCentres C ON A.Centre = C.Nom_Centre;

-------------------------------------------------------
-- 4. INSERTION DES COMMUNES (15 Communes)
-------------------------------------------------------
PRINT '--- 4. Insertion des 15 Communes (réparties sur les agences) ---';

INSERT INTO dbo.DIM_COMMUNE (FK_Agence, Nom_Commune)
SELECT
    A.AgenceId,
    C.Nom_Commune
FROM (
    -- TahTouh (3 communes)
    SELECT 'Medea' AS Nom_Commune, 'TahTouh' AS Agence
    UNION ALL SELECT 'Ouamri', 'TahTouh'
    UNION ALL SELECT 'Tamesguida', 'TahTouh'
    
    -- 24Février (2 communes)
    UNION ALL SELECT 'Seghouane', '24Février'
    UNION ALL SELECT 'Derrag', '24Février'
    
    -- Ouzra (1 commune)
    UNION ALL SELECT 'Ouzra', 'Ouzra'
    
    -- Berrouaghia Ville (2 communes)
    UNION ALL SELECT 'Berrouaghia', 'Berrouaghia Ville'
    UNION ALL SELECT 'Sidi Naamane', 'Berrouaghia Ville'
    
    -- Sidi Merabet (1 commune)
    UNION ALL SELECT 'Ain Boucif', 'Sidi Merabet'
    
    -- Ksar Centre (1 commune)
    UNION ALL SELECT 'Ksar Boukhari', 'Ksar Centre'
    
    -- Ouled Hellal (1 commune)
    UNION ALL SELECT 'Ouled Hellal', 'Ouled Hellal'

    -- Beni Slimane Nord (2 communes)
    UNION ALL SELECT 'Beni Slimane', 'Beni Slimane Nord'
    UNION ALL SELECT 'Ouled Brahim', 'Beni Slimane Nord'
    
    -- Aziz (1 commune)
    UNION ALL SELECT 'Aziz', 'Aziz'

    -- Si El Mahdjoub (1 commune)
    UNION ALL SELECT 'Si El Mahdjoub', 'Si El Mahdjoub'
) AS C
JOIN @InsertedAgences A ON C.Agence = A.Nom_Agence;


-------------------------------------------------------
-- VÉRIFICATION GLOBALE (Synthèse)
-------------------------------------------------------
PRINT '--- Vérification des données insérées ---';

SELECT 
    'Catégories' AS Entité, COUNT(*) AS Nombre_Inséré FROM @InsertedCategories 
UNION ALL
SELECT 
    'Centres' AS Entité, COUNT(*) AS Nombre_Inséré FROM @InsertedCentres 
UNION ALL
SELECT 
    'Agences' AS Entité, COUNT(*) AS Nombre_Inséré FROM @InsertedAgences 
UNION ALL
SELECT 
    'Communes' AS Entité, COUNT(*) AS Nombre_Inséré FROM dbo.DIM_COMMUNE WHERE FK_Agence IN (SELECT AgenceId FROM @InsertedAgences);

GO

-- Affichage détaillé de la hiérarchie pour confirmation
SELECT
    CEN.Nom_Centre,
    AGE.Nom_Agence,
    COM.Nom_Commune
FROM
    dbo.DIM_CENTRE CEN
JOIN
    dbo.DIM_AGENCE AGE ON CEN.CentreId = AGE.FK_Centre
JOIN
    dbo.DIM_COMMUNE COM ON AGE.AgenceId = COM.FK_Agence
ORDER BY CEN.Nom_Centre, AGE.Nom_Agence, COM.Nom_Commune;
GO