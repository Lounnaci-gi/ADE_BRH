# Spécification Technique : Agrégation des Données Journalières par Date Unique

## Vue d'ensemble

La section "Données Détaillées par Agence" de la page `/bilans-detailles` a été modifiée pour garantir l'**unicité des dates** et l'**agrégation des réalisations** pour chaque jour de la période sélectionnée.

## Problème Résolu

**AVANT :** Possibilité d'avoir plusieurs enregistrements pour la même date, créant des doublons et une confusion dans l'affichage.

**APRÈS :** Une seule ligne par date avec toutes les réalisations agrégées (somme totale) pour ce jour-là.

## Logique d'Agrégation

### 🔄 **Principe d'Agrégation**

Pour chaque date dans l'intervalle `[date1, date2]` :
- **Une seule ligne** par date unique
- **Somme totale** de toutes les réalisations pour cette date
- **Consolidation** des objectifs (première occurrence)

### 📊 **Formule d'Agrégation**

```
Réalisation_Date_unique = Σ(Toutes les réalisations de l'agence pour cette date)
```

**Exemple :** Si l'agence a 3 enregistrements pour le 25/10/2024 :
- Enregistrement 1 : 10 relances, 5000 DA
- Enregistrement 2 : 5 relances, 2500 DA  
- Enregistrement 3 : 8 relances, 4000 DA
- **Résultat agrégé :** 23 relances, 11500 DA

## Modifications Backend

### 🔧 **Requête SQL avec GROUP BY**

**Fichier modifié :** `backend/routes/kpi.js` - Endpoint `/api/kpi/detailed-data`

**Nouvelle requête avec agrégation :**
```sql
SELECT 
  k.DateKPI,
  -- Agrégation des réalisations (somme pour chaque date)
  SUM(k.Nb_RelancesEnvoyees) as Nb_RelancesEnvoyees,
  SUM(k.Mt_RelancesEnvoyees) as Mt_RelancesEnvoyees,
  SUM(k.Nb_RelancesReglees) as Nb_RelancesReglees,
  SUM(k.Mt_RelancesReglees) as Mt_RelancesReglees,
  SUM(k.Nb_MisesEnDemeure_Envoyees) as Nb_MisesEnDemeure_Envoyees,
  SUM(k.Mt_MisesEnDemeure_Envoyees) as Mt_MisesEnDemeure_Envoyees,
  SUM(k.Nb_MisesEnDemeure_Reglees) as Nb_MisesEnDemeure_Reglees,
  SUM(k.Mt_MisesEnDemeure_Reglees) as Mt_MisesEnDemeure_Reglees,
  SUM(k.Nb_Dossiers_Juridiques) as Nb_Dossiers_Juridiques,
  SUM(k.Mt_Dossiers_Juridiques) as Mt_Dossiers_Juridiques,
  SUM(k.Nb_Coupures) as Nb_Coupures,
  SUM(k.Mt_Coupures) as Mt_Coupures,
  SUM(k.Nb_Retablissements) as Nb_Retablissements,
  SUM(k.Mt_Retablissements) as Mt_Retablissements,
  SUM(k.Nb_Compteurs_Remplaces) as Nb_Compteurs_Remplaces,
  SUM(k.Encaissement_Journalier_Global) as Encaissement_Journalier_Global,
  -- Observation (première occurrence)
  MIN(k.Observation) as Observation,
  -- Informations agence (première occurrence)
  MIN(a.Nom_Agence) as Nom_Agence,
  MIN(c.Nom_Centre) as Nom_Centre,
  -- Objectifs (première occurrence - ils sont identiques pour une même date)
  MIN(o.Obj_Encaissement) as Obj_Encaissement,
  MIN(o.Obj_Relances) as Obj_Relances,
  MIN(o.Obj_MisesEnDemeure) as Obj_MisesEnDemeure,
  MIN(o.Obj_Dossiers_Juridiques) as Obj_Dossiers_Juridiques,
  MIN(o.Obj_Coupures) as Obj_Coupures,
  MIN(o.Obj_Controles) as Obj_Controles,
  MIN(o.Obj_Compteurs_Remplaces) as Obj_Compteurs_Remplaces
FROM dbo.FAIT_KPI_ADE k
LEFT JOIN dbo.DIM_AGENCE a ON k.AgenceId = a.AgenceId
LEFT JOIN dbo.DIM_CENTRE c ON a.FK_Centre = c.CentreId
LEFT JOIN dbo.DIM_OBJECTIF o ON k.AgenceId = o.FK_Agence 
  AND o.DateDebut <= k.DateKPI 
  AND o.DateFin >= k.DateKPI 
  AND o.IsActive = 1
WHERE k.AgenceId = @agenceId 
  AND k.DateKPI >= @startDate 
  AND k.DateKPI <= @endDate
GROUP BY k.DateKPI
ORDER BY k.DateKPI ASC
```

### 🎯 **Fonctions d'Agrégation Utilisées**

1. **SUM()** pour les réalisations :
   - `SUM(k.Nb_RelancesEnvoyees)` → Somme des relances envoyées
   - `SUM(k.Mt_RelancesEnvoyees)` → Somme des montants de relances
   - `SUM(k.Encaissement_Journalier_Global)` → Somme des encaissements

2. **MIN()** pour les métadonnées :
   - `MIN(k.Observation)` → Première observation
   - `MIN(a.Nom_Agence)` → Nom de l'agence
   - `MIN(o.Obj_Encaissement)` → Objectif d'encaissement

3. **GROUP BY** pour l'unicité :
   - `GROUP BY k.DateKPI` → Une ligne par date unique

## Avantages de l'Agrégation

### ✅ **Bénéfices Techniques**

1. **Unicité garantie** : Chaque date apparaît une seule fois
2. **Données consolidées** : Toutes les réalisations d'une journée sur une ligne
3. **Performance optimisée** : Moins de lignes à traiter et afficher
4. **Cohérence des données** : Élimination des doublons et incohérences

### 📊 **Bénéfices Utilisateur**

1. **Vue claire** : Une ligne par jour, facile à lire
2. **Données complètes** : Toutes les réalisations d'une journée agrégées
3. **Suivi précis** : Pas de confusion avec des doublons
4. **Analyse facilitée** : Comparaison jour par jour simplifiée

## Exemple d'Agrégation

### 📋 **Scénario : Données Multiples par Jour**

**Données brutes (avant agrégation) :**
```
Date: 2024-12-01
- Enregistrement 1: 10 relances, 5000 DA, 2 mises en demeure
- Enregistrement 2: 5 relances, 2500 DA, 1 mise en demeure  
- Enregistrement 3: 8 relances, 4000 DA, 3 mises en demeure
```

**Données agrégées (après GROUP BY) :**
```
Date: 2024-12-01
- Relances: 23 (10+5+8), 11500 DA (5000+2500+4000)
- Mises en demeure: 6 (2+1+3)
```

### 🎯 **Résultat Final**

Le tableau affiche maintenant :
- **Une ligne par date** dans l'intervalle sélectionné
- **Réalisations agrégées** (somme totale pour chaque métrique)
- **Objectifs consolidés** (première occurrence)
- **Métadonnées préservées** (nom agence, centre, etc.)

## Validation et Tests

### 🧪 **Script de Test : `test-aggregation-dates.js`**

**Tests implémentés :**
1. **Unicité des dates** : Vérification qu'aucune date n'est dupliquée
2. **Agrégation des réalisations** : Validation des sommes
3. **Consolidation des objectifs** : Vérification des MIN()
4. **Cohérence des données** : Validation des valeurs positives

**Critères de validation :**
- ✅ **Chaque date unique** : `data.length === uniqueDates.length`
- ✅ **Réalisations agrégées** : Somme des valeurs pour chaque date
- ✅ **Objectifs consolidés** : Première occurrence sans doublons
- ✅ **Données cohérentes** : Valeurs positives ou nulles

### 📊 **Exemple de Validation**

```javascript
// Vérification de l'unicité
const dates = data.data.map(record => record.DateKPI);
const uniqueDates = [...new Set(dates)];
const isUnique = data.data.length === uniqueDates.length;

// Vérification de l'agrégation
const totalRelances = data.data.reduce((sum, record) => 
  sum + (record.Nb_RelancesEnvoyees || 0), 0);

// Vérification des objectifs
const objectivesPresent = data.data.every(record => 
  record.Obj_Encaissement !== null && record.Obj_Relances !== null);
```

## Cas d'Usage

### 📅 **Scénarios d'Agrégation**

1. **Données uniques par jour** : Pas d'agrégation nécessaire
2. **Données multiples par jour** : Agrégation automatique
3. **Période sans données** : Aucun enregistrement retourné
4. **Période partielle** : Agrégation des jours disponibles

### 🎯 **Exemples Concrets**

**Cas 1 : Saisie multiple dans la journée**
- Matin : 5 relances, 2500 DA
- Après-midi : 3 relances, 1500 DA
- **Résultat :** 8 relances, 4000 DA (une ligne)

**Cas 2 : Saisie unique dans la journée**
- Journée : 12 relances, 6000 DA
- **Résultat :** 12 relances, 6000 DA (une ligne)

**Cas 3 : Période de 3 jours**
- Jour 1 : 8 relances, 4000 DA
- Jour 2 : 15 relances, 7500 DA  
- Jour 3 : 10 relances, 5000 DA
- **Résultat :** 3 lignes (une par jour)

## Conclusion

### ✅ **Agrégation Réussie**

La modification apporte :

1. **Unicité des dates** : Chaque date apparaît une seule fois
2. **Agrégation des réalisations** : Somme totale par jour
3. **Consolidation des objectifs** : Première occurrence sans doublons
4. **Performance optimisée** : Moins de lignes, plus de clarté

### 🎯 **Résultat Final**

Le tableau "Données Détaillées par Agence" garantit maintenant :
- **Une ligne par date unique** dans l'intervalle sélectionné
- **Réalisations agrégées** (somme totale pour chaque métrique)
- **Objectifs consolidés** (première occurrence)
- **Affichage cohérent** et sans doublons

L'agrégation respecte entièrement la spécification demandée et offre une vue d'ensemble claire et consolidée des performances de l'agence sélectionnée.
