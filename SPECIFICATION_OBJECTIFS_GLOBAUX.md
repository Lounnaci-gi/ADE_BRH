# Spécification Technique : Agrégation des Objectifs dans le Résumé Global

## Vue d'ensemble

Le formulaire "Résumé Global" de la page `/bilans-detailles` implémente l'agrégation des objectifs selon la spécification suivante :

**Objectif Global = Σ (Objectif de l'indicateur pour chaque agence)**

## Architecture Technique

### 1. Backend - Endpoint `/api/kpi/global-summary`

**Fichier :** `backend/routes/kpi.js`

**Fonctionnalité :** Calcule les totaux globaux et les taux de performance pour toutes les agences.

**Requête SQL principale :**
```sql
SELECT 
  -- Totaux des réalisations
  SUM(k.Nb_RelancesEnvoyees) as Total_RelancesEnvoyees,
  SUM(k.Mt_RelancesEnvoyees) as Total_Mt_RelancesEnvoyees,
  -- ... autres totaux
  
  -- Totaux des objectifs (AGREGATION GLOBALE)
  SUM(o.Obj_Relances) as Total_Obj_Relances,
  SUM(o.Obj_MisesEnDemeure) as Total_Obj_MisesEnDemeure,
  SUM(o.Obj_Dossiers_Juridiques) as Total_Obj_DossiersJuridiques,
  SUM(o.Obj_Coupures) as Total_Obj_Coupures,
  SUM(o.Obj_Controles) as Total_Obj_Controles,
  SUM(o.Obj_Compteurs_Remplaces) as Total_Obj_CompteursRemplaces,
  SUM(o.Obj_Encaissement) as Total_Obj_Encaissement,
  
  -- Calcul des taux basés sur les objectifs globaux
  CASE 
    WHEN SUM(o.Obj_Relances) > 0 
    THEN ROUND((SUM(k.Nb_RelancesEnvoyees) * 100.0) / SUM(o.Obj_Relances), 2)
    ELSE 0 
  END as Taux_Relances,
  -- ... autres taux
  
FROM dbo.FAIT_KPI_ADE k
LEFT JOIN dbo.DIM_OBJECTIF o ON k.AgenceId = o.FK_Agence 
  AND o.DateDebut <= @dateKey 
  AND o.DateFin >= @dateKey 
  AND o.IsActive = 1
WHERE k.DateKPI = @dateKey
```

### 2. Frontend - Service API

**Fichier :** `frontend/src/services/kpiService.js`

**Méthode :** `getGlobalSummary(dateKey)`
```javascript
async getGlobalSummary(dateKey) {
  const res = await api.get(`/kpi/global-summary?dateKey=${dateKey}`);
  return res.data;
}
```

### 3. Frontend - Interface Utilisateur

**Fichier :** `frontend/src/pages/BilansDetailles.js`

**Fonctionnalité :** Affiche les objectifs globaux et les taux calculés dans chaque carte du résumé.

**Exemple d'affichage :**
```javascript
// Carte Encaissement Global
<div className="text-xs text-gray-400">
  Objectif: {formatCurrency(summaryTotals.totalObjEncaissement)}
</div>
<div className="flex items-center justify-between">
  <span className="text-xs text-gray-500">Taux:</span>
  <div className="flex items-center gap-1">
    <span className="text-sm font-bold text-emerald-700">{summaryTotals.tauxEncaissement}%</span>
    <div className={`w-2 h-2 rounded-full ${summaryTotals.tauxEncaissement >= 100 ? 'bg-green-500' : summaryTotals.tauxEncaissement >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
  </div>
</div>
```

## Logique de Calcul

### Formule de l'Objectif Global

Pour chaque indicateur, l'objectif global est calculé comme suit :

```
Objectif Global = Σ(i=1 à n) Objectif_Agence_i
```

Où :
- `n` = nombre total d'agences
- `Objectif_Agence_i` = objectif de l'agence i pour l'indicateur donné

### Formule du Taux de Performance

```
Taux (%) = (Réalisé Global / Objectif Global) × 100
```

Où :
- `Réalisé Global` = somme des réalisations de toutes les agences
- `Objectif Global` = somme des objectifs de toutes les agences

## Exemple Illustratif

### Données d'entrée

| Indicateur | Agence 1 (Objectif) | Agence 2 (Objectif) | Agence 3 (Objectif) |
|------------|---------------------|---------------------|---------------------|
| Encaissement | 250 000 DA | 310 000 DA | 200 000 DA |
| Relances | 100 | 150 | 120 |
| Mises en Demeure | 50 | 75 | 60 |

### Calculs

**Objectifs Globaux :**
- Encaissement Global = 250 000 + 310 000 + 200 000 = **760 000 DA**
- Relances Global = 100 + 150 + 120 = **370**
- Mises en Demeure Global = 50 + 75 + 60 = **185**

**Réalisations Globales (exemple) :**
- Encaissement Réalisé = 200 000 + 280 000 + 180 000 = **660 000 DA**
- Relances Réalisées = 80 + 140 + 100 = **320**
- Mises en Demeure Réalisées = 45 + 70 + 55 = **170**

**Taux Calculés :**
- Taux Encaissement = (660 000 / 760 000) × 100 = **86.84%**
- Taux Relances = (320 / 370) × 100 = **86.49%**
- Taux Mises en Demeure = (170 / 185) × 100 = **91.89%**

## Indicateurs Supportés

1. **Encaissement Global** (`Obj_Encaissement`)
2. **Relances Envoyées** (`Obj_Relances`)
3. **Mises en Demeure** (`Obj_MisesEnDemeure`)
4. **Dossiers Juridiques** (`Obj_Dossiers_Juridiques`)
5. **Coupures** (`Obj_Coupures`)
6. **Contrôles** (`Obj_Controles`)
7. **Compteurs Remplacés** (`Obj_Compteurs_Remplaces`)

## Validation et Tests

### Script de Test

Un script de test est disponible dans `test-objectives-aggregation.js` pour valider :
- La récupération des données depuis l'API
- Le calcul correct des objectifs globaux
- La validation des taux calculés
- La cohérence des données affichées

### Critères de Validation

1. ✅ **Agrégation des objectifs** : Les objectifs globaux sont la somme des objectifs individuels
2. ✅ **Calcul des taux** : Les taux sont calculés sur la base des objectifs globaux
3. ✅ **Affichage cohérent** : L'interface affiche les objectifs et taux correctement
4. ✅ **Performance** : Un seul appel API récupère toutes les données nécessaires

## Implémentation Actuelle

L'implémentation actuelle respecte entièrement la spécification demandée :

- ✅ **Objectifs globaux** : Calculés par agrégation des objectifs individuels
- ✅ **Taux de performance** : Basés sur les objectifs globaux
- ✅ **Interface utilisateur** : Affichage clair des objectifs et taux
- ✅ **Performance optimisée** : Requête SQL unique pour toutes les données

## Conclusion

La spécification d'agrégation des objectifs est **entièrement implémentée et fonctionnelle** dans le système actuel. Le formulaire "Résumé Global" affiche correctement :

1. Les objectifs globaux (somme des objectifs de toutes les agences)
2. Les taux de performance calculés sur la base de ces objectifs globaux
3. Une interface utilisateur claire et informative

La logique de calcul respecte exactement la formule demandée : **Objectif Global = Σ (Objectif de l'indicateur pour chaque agence)**
