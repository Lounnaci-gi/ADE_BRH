USE ADE_KPI;
GO

/*******************************************************
  INSERTION DES CATÉGORIES (4)
*******************************************************/
SET IDENTITY_INSERT dbo.DIM_CATEGORIE ON;

INSERT INTO dbo.DIM_CATEGORIE (CategorieId, CodeCategorie, Libelle, Description)
VALUES 
    (1, 'DOM', 'Domestique', 'Clients résidentiels - usage domestique'),
    (2, 'COM', 'Commercial', 'Clients commerciaux et professionnels'),
    (3, 'IND', 'Industriel', 'Clients industriels - grandes consommations'),
    (4, 'ADM', 'Administration', 'Administrations publiques et institutions');

SET IDENTITY_INSERT dbo.DIM_CATEGORIE OFF;
GO

/*******************************************************
  INSERTION DES CENTRES (5)
*******************************************************/
SET IDENTITY_INSERT dbo.DIM_CENTRE ON;

INSERT INTO dbo.DIM_CENTRE (CentreId, Nom_Centre, Adresse, Telephone, Telephone2, Email, Fax, Nom_Banque, Compte_Bancaire, NIF, NIS, RC)
VALUES 
    (1, 'Centre Alger', 'Boulevard Mohamed V, Alger 16000', '023 45 67 89', '023 45 67 90', 'centre.alger@ade.dz', '023 45 67 91', 'BNA', '0079 9999 1234567890 12', '099916000123456', '199916B0123456', '16/00-1234567B23'),
    (2, 'Centre Oran', 'Avenue de l''ALN, Oran 31000', '041 23 45 67', '041 23 45 68', 'centre.oran@ade.dz', '041 23 45 69', 'BEA', '0080 8888 2345678901 23', '099931000234567', '199931B0234567', '31/00-2345678B34'),
    (3, 'Centre Constantine', 'Rue Didouche Mourad, Constantine 25000', '031 87 65 43', '031 87 65 44', 'centre.constantine@ade.dz', '031 87 65 45', 'CPA', '0082 7777 3456789012 34', '099925000345678', '199925B0345678', '25/00-3456789B45'),
    (4, 'Centre Annaba', 'Boulevard du 1er Novembre, Annaba 23000', '038 54 32 10', '038 54 32 11', 'centre.annaba@ade.dz', '038 54 32 12', 'BADR', '0081 6666 4567890123 45', '099923000456789', '199923B0456789', '23/00-4567890B56'),
    (5, 'Centre Blida', 'Place de la Liberté, Blida 09000', '025 98 76 54', '025 98 76 55', 'centre.blida@ade.dz', '025 98 76 56', 'CNEP', '0083 5555 5678901234 56', '099909000567890', '199909B0567890', '09/00-5678901B67');

SET IDENTITY_INSERT dbo.DIM_CENTRE OFF;
GO

/*******************************************************
  INSERTION DES AGENCES (10)
*******************************************************/
SET IDENTITY_INSERT dbo.DIM_AGENCE ON;

INSERT INTO dbo.DIM_AGENCE (AgenceId, FK_Centre, Nom_Agence, Adresse, Telephone, Telephone2, Email, Fax)
VALUES 
    -- Agences Centre Alger (3)
    (1, 1, 'Agence Bab El Oued', 'Rue Tripoli, Bab El Oued, Alger', '023 12 34 56', '023 12 34 57', 'ag.babeloued@ade.dz', '023 12 34 58'),
    (2, 1, 'Agence Hussein Dey', 'Avenue Pasteur, Hussein Dey, Alger', '023 23 45 67', '023 23 45 68', 'ag.husseindey@ade.dz', '023 23 45 69'),
    (3, 1, 'Agence Birtouta', 'Route Nationale 1, Birtouta, Alger', '023 34 56 78', NULL, 'ag.birtouta@ade.dz', NULL),
    
    -- Agences Centre Oran (2)
    (4, 2, 'Agence Es Senia', 'Rue Larbi Ben M''hidi, Es Senia, Oran', '041 34 56 78', '041 34 56 79', 'ag.essenia@ade.dz', '041 34 56 80'),
    (5, 2, 'Agence Bir El Djir', 'Boulevard de la Soummam, Bir El Djir, Oran', '041 45 67 89', NULL, 'ag.bireldjir@ade.dz', NULL),
    
    -- Agences Centre Constantine (2)
    (6, 3, 'Agence Zouaghi', 'Rue des Frères Ferrad, Zouaghi, Constantine', '031 56 78 90', '031 56 78 91', 'ag.zouaghi@ade.dz', '031 56 78 92'),
    (7, 3, 'Agence El Khroub', 'Avenue de l''Indépendance, El Khroub', '031 67 89 01', NULL, 'ag.elkhroub@ade.dz', NULL),
    
    -- Agences Centre Annaba (2)
    (8, 4, 'Agence Sidi Amar', 'Rue de la Révolution, Sidi Amar, Annaba', '038 78 90 12', '038 78 90 13', 'ag.sidiamar@ade.dz', NULL),
    (9, 4, 'Agence Berrahal', 'Boulevard Bouguerra, Berrahal, Annaba', '038 89 01 23', NULL, 'ag.berrahal@ade.dz', NULL),
    
    -- Agence Centre Blida (1)
    (10, 5, 'Agence Ouled Yaïch', 'Avenue Ahmed Zabana, Ouled Yaïch, Blida', '025 90 12 34', '025 90 12 35', 'ag.ouledyaich@ade.dz', '025 90 12 36');

SET IDENTITY_INSERT dbo.DIM_AGENCE OFF;
GO

/*******************************************************
  INSERTION DES COMMUNES (8)
*******************************************************/
SET IDENTITY_INSERT dbo.DIM_COMMUNE ON;

INSERT INTO dbo.DIM_COMMUNE (CommuneId, FK_Agence, Nom_Commune)
VALUES 
    -- Communes pour Agence Bab El Oued
    (1, 1, 'Bab El Oued'),
    (2, 1, 'Oued Koriche'),
    
    -- Communes pour Agence Hussein Dey
    (3, 2, 'Hussein Dey'),
    (4, 2, 'Kouba'),
    
    -- Commune pour Agence Es Senia
    (5, 4, 'Es Senia'),
    
    -- Commune pour Agence Zouaghi
    (6, 6, 'Constantine Centre'),
    
    -- Commune pour Agence Sidi Amar
    (7, 8, 'Sidi Amar'),
    
    -- Commune pour Agence Ouled Yaïch
    (8, 10, 'Ouled Yaïch');

SET IDENTITY_INSERT dbo.DIM_COMMUNE OFF;
GO

/*******************************************************
  INSERTION DES OBJECTIFS POUR CHAQUE AGENCE
  Période : 01/01/2025 - 31/12/2025
*******************************************************/
SET IDENTITY_INSERT dbo.DIM_OBJECTIF ON;

INSERT INTO dbo.DIM_OBJECTIF (ObjectifId, FK_Agence, DateDebut, DateFin, Titre, Description, 
    Obj_Encaissement, Obj_Coupures, Obj_Dossiers_Juridiques, Obj_MisesEnDemeure, 
    Obj_Relances, Obj_Controles, Obj_Compteurs_Remplaces, IsActive)
VALUES 
    (1, 1, '2025-01-01', '2025-12-31', 'Objectifs 2025 - Agence Bab El Oued', 'Objectifs annuels pour améliorer le recouvrement', 
        385000.00, 48, 17, 16, 125, 18, 8, 1),
    (2, 2, '2025-01-01', '2025-12-31', 'Objectifs 2025 - Agence Hussein Dey', 'Objectifs annuels pour améliorer le recouvrement', 
        420000.00, 55, 19, 18, 140, 19, 9, 1),
    (3, 3, '2025-01-01', '2025-12-31', 'Objectifs 2025 - Agence Birtouta', 'Objectifs annuels pour améliorer le recouvrement', 
        295000.00, 38, 12, 11, 85, 14, 6, 1),
    (4, 4, '2025-01-01', '2025-12-31', 'Objectifs 2025 - Agence Es Senia', 'Objectifs annuels pour améliorer le recouvrement', 
        365000.00, 45, 15, 14, 110, 17, 7, 1),
    (5, 5, '2025-01-01', '2025-12-31', 'Objectifs 2025 - Agence Bir El Djir', 'Objectifs annuels pour améliorer le recouvrement', 
        310000.00, 42, 13, 12, 95, 15, 5, 1),
    (6, 6, '2025-01-01', '2025-12-31', 'Objectifs 2025 - Agence Zouaghi', 'Objectifs annuels pour améliorer le recouvrement', 
        445000.00, 58, 20, 19, 145, 20, 10, 1),
    (7, 7, '2025-01-01', '2025-12-31', 'Objectifs 2025 - Agence El Khroub', 'Objectifs annuels pour améliorer le recouvrement', 
        275000.00, 35, 10, 9, 75, 12, 4, 1),
    (8, 8, '2025-01-01', '2025-12-31', 'Objectifs 2025 - Agence Sidi Amar', 'Objectifs annuels pour améliorer le recouvrement', 
        340000.00, 43, 14, 13, 100, 16, 6, 1),
    (9, 9, '2025-01-01', '2025-12-31', 'Objectifs 2025 - Agence Berrahal', 'Objectifs annuels pour améliorer le recouvrement', 
        260000.00, 32, 9, 8, 65, 11, 3, 1),
    (10, 10, '2025-01-01', '2025-12-31', 'Objectifs 2025 - Agence Ouled Yaïch', 'Objectifs annuels pour améliorer le recouvrement', 
        325000.00, 40, 13, 12, 90, 15, 7, 1);

SET IDENTITY_INSERT dbo.DIM_OBJECTIF OFF;
GO

/*******************************************************
  INSERTION DES FAITS KPI - OCTOBRE 2025
  Période : 01/10/2025 au 27/10/2025 (excluant les vendredis)
  Vendredis exclus : 04/10, 11/10, 18/10, 25/10
*******************************************************/

-- Variable pour générer des variations aléatoires
DECLARE @dates TABLE (DateKPI DATE);
INSERT INTO @dates VALUES 
    ('2025-10-01'), ('2025-10-02'), ('2025-10-03'), -- Mer, Jeu, Ven (exclu)
    ('2025-10-05'), ('2025-10-06'), ('2025-10-07'), ('2025-10-08'), ('2025-10-09'), ('2025-10-10'), -- Sam-Jeu
    ('2025-10-12'), ('2025-10-13'), ('2025-10-14'), ('2025-10-15'), ('2025-10-16'), ('2025-10-17'), -- Sam-Jeu
    ('2025-10-19'), ('2025-10-20'), ('2025-10-21'), ('2025-10-22'), ('2025-10-23'), ('2025-10-24'), -- Sam-Jeu
    ('2025-10-26'), ('2025-10-27'); -- Sam, Dim

-- Insertion des données pour chaque agence, chaque catégorie, chaque jour
INSERT INTO dbo.FAIT_KPI_ADE (
    AgenceId, DateKPI, CategorieId,
    Nb_RelancesEnvoyees, Mt_RelancesEnvoyees, Nb_RelancesReglees, Mt_RelancesReglees,
    Nb_MisesEnDemeure_Envoyees, Mt_MisesEnDemeure_Envoyees, Nb_MisesEnDemeure_Reglees, Mt_MisesEnDemeure_Reglees,
    Nb_Dossiers_Juridiques, Mt_Dossiers_Juridiques,
    Nb_Coupures, Mt_Coupures,
    Nb_Retablissements, Mt_Retablissements,
    Nb_Branchements, Nb_Compteurs_Remplaces, Nb_Controles,
    Encaissement_Journalier_Global
)
SELECT 
    a.AgenceId,
    d.DateKPI,
    c.CategorieId,
    -- Relances (variation ±50% de l'objectif quotidien)
    CAST((o.Obj_Relances / 30.0) * (0.5 + RAND(CHECKSUM(NEWID())) * 1.0) AS INT),
    CAST((o.Obj_Encaissement * 0.15 / 30.0) * (0.5 + RAND(CHECKSUM(NEWID())) * 1.0) AS MONEY),
    CAST((o.Obj_Relances / 30.0) * (0.3 + RAND(CHECKSUM(NEWID())) * 0.4) AS INT),
    CAST((o.Obj_Encaissement * 0.10 / 30.0) * (0.3 + RAND(CHECKSUM(NEWID())) * 0.4) AS MONEY),
    -- Mises en demeure
    CAST((o.Obj_MisesEnDemeure / 30.0) * (0.5 + RAND(CHECKSUM(NEWID())) * 1.0) AS INT),
    CAST((o.Obj_Encaissement * 0.12 / 30.0) * (0.5 + RAND(CHECKSUM(NEWID())) * 1.0) AS MONEY),
    CAST((o.Obj_MisesEnDemeure / 30.0) * (0.2 + RAND(CHECKSUM(NEWID())) * 0.3) AS INT),
    CAST((o.Obj_Encaissement * 0.08 / 30.0) * (0.2 + RAND(CHECKSUM(NEWID())) * 0.3) AS MONEY),
    -- Dossiers juridiques
    CAST((o.Obj_Dossiers_Juridiques / 30.0) * (0.5 + RAND(CHECKSUM(NEWID())) * 1.0) AS INT),
    CAST((o.Obj_Encaissement * 0.18 / 30.0) * (0.5 + RAND(CHECKSUM(NEWID())) * 1.0) AS MONEY),
    -- Coupures
    CAST((o.Obj_Coupures / 30.0) * (0.5 + RAND(CHECKSUM(NEWID())) * 1.0) AS INT),
    CAST((o.Obj_Encaissement * 0.08 / 30.0) * (0.5 + RAND(CHECKSUM(NEWID())) * 1.0) AS MONEY),
    -- Rétablissements (environ 60% des coupures)
    CAST((o.Obj_Coupures / 30.0) * 0.6 * (0.5 + RAND(CHECKSUM(NEWID())) * 1.0) AS INT),
    CAST((o.Obj_Encaissement * 0.05 / 30.0) * (0.5 + RAND(CHECKSUM(NEWID())) * 1.0) AS MONEY),
    -- Branchements (1-3 par jour en moyenne)
    CAST(1 + RAND(CHECKSUM(NEWID())) * 2 AS INT),
    -- Compteurs remplacés
    CAST((o.Obj_Compteurs_Remplaces / 30.0) * (0.5 + RAND(CHECKSUM(NEWID())) * 1.0) AS INT),
    -- Contrôles
    CAST((o.Obj_Controles / 30.0) * (0.5 + RAND(CHECKSUM(NEWID())) * 1.0) AS INT),
    -- Encaissement journalier (variation ±50%)
    CAST((o.Obj_Encaissement / 30.0) * (0.5 + RAND(CHECKSUM(NEWID())) * 1.0) AS MONEY)
FROM 
    dbo.DIM_AGENCE a
    CROSS JOIN @dates d
    CROSS JOIN dbo.DIM_CATEGORIE c
    INNER JOIN dbo.DIM_OBJECTIF o ON a.AgenceId = o.FK_Agence AND o.IsActive = 1
WHERE 
    -- Exclure les vendredis
    DATEPART(WEEKDAY, d.DateKPI) != 6; -- 6 = Vendredi (si DATEFIRST = 7)

GO

/*******************************************************
  AFFICHAGE DES STATISTIQUES
*******************************************************/
PRINT '========================================================';
PRINT '✓ INSERTION DES DONNÉES TERMINÉE AVEC SUCCÈS';
PRINT '========================================================';
PRINT '';
PRINT 'RÉSUMÉ DES INSERTIONS :';
PRINT '------------------------';
PRINT 'Catégories insérées     : ' + CAST((SELECT COUNT(*) FROM dbo.DIM_CATEGORIE) AS VARCHAR(10));
PRINT 'Centres insérés         : ' + CAST((SELECT COUNT(*) FROM dbo.DIM_CENTRE) AS VARCHAR(10));
PRINT 'Agences insérées        : ' + CAST((SELECT COUNT(*) FROM dbo.DIM_AGENCE) AS VARCHAR(10));
PRINT 'Communes insérées       : ' + CAST((SELECT COUNT(*) FROM dbo.DIM_COMMUNE) AS VARCHAR(10));
PRINT 'Objectifs insérés       : ' + CAST((SELECT COUNT(*) FROM dbo.DIM_OBJECTIF) AS VARCHAR(10));
PRINT 'KPI Faits insérés       : ' + CAST((SELECT COUNT(*) FROM dbo.FAIT_KPI_ADE) AS VARCHAR(10));
PRINT '';
PRINT 'PÉRIODE DES DONNÉES KPI :';
PRINT '------------------------';
PRINT 'Date début              : ' + CONVERT(VARCHAR(10), (SELECT MIN(DateKPI) FROM dbo.FAIT_KPI_ADE), 103);
PRINT 'Date fin                : ' + CONVERT(VARCHAR(10), (SELECT MAX(DateKPI) FROM dbo.FAIT_KPI_ADE), 103);
PRINT 'Nombre de jours         : ' + CAST((SELECT COUNT(DISTINCT DateKPI) FROM dbo.FAIT_KPI_ADE) AS VARCHAR(10));
PRINT '';
PRINT '========================================================';
GO

-- Vérification : Afficher un échantillon de données
SELECT TOP 20
    a.Nom_Agence,
    k.DateKPI,
    cat.Libelle AS Categorie,
    k.Encaissement_Journalier_Global,
    k.Nb_Coupures,
    k.Nb_RelancesEnvoyees,
    k.Nb_Controles
FROM dbo.FAIT_KPI_ADE k
INNER JOIN dbo.DIM_AGENCE a ON k.AgenceId = a.AgenceId
INNER JOIN dbo.DIM_CATEGORIE cat ON k.CategorieId = cat.CategorieId
ORDER BY k.DateKPI DESC, a.Nom_Agence, cat.Libelle;
GO