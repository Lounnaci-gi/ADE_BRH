# Spécification Technique : Consolidation des Données Détaillées par Agence

## Vue d'ensemble

La section "Données Détaillées par Agence" de la page `/bilans-detailles` a été modifiée pour afficher **une seule ligne par date**, consolidant toutes les données de catégories pour chaque jour.

## Problème Résolu

**AVANT :** Les données étaient affichées sur plusieurs lignes pour une même date (une ligne par catégorie/indicateur).

**APRÈS :** Une seule ligne par date avec toutes les catégories consolidées horizontalement.

## Structure de la Table Consolidée

### 📊 **Nouvelle Structure du Tableau**

| Date | Encaissement | Relances | Mises en Demeure | Dossiers Juridiques | Coupures | Rétablissements | Compteurs |
|------|-------------|----------|------------------|-------------------|----------|-----------------|-----------|
| JJ/MM/AAAA | Objectif \| Réalisation \| Taux | Objectif \| Réalisation \| Taux | Objectif \| Réalisation \| Taux | Objectif \| Réalisation \| Taux | Objectif \| Réalisation \| Taux | Réalisation | Objectif \| Réalisation \| Taux |
| JJ/MM/AAAA+1 | Objectif \| Réalisation \| Taux | Objectif \| Réalisation \| Taux | Objectif \| Réalisation \| Taux | Objectif \| Réalisation \| Taux | Objectif \| Réalisation \| Taux | Réalisation | Objectif \| Réalisation \| Taux |

### 🎯 **Format d'Affichage par Colonne**

Chaque colonne affiche trois éléments :
1. **Objectif** : Valeur cible (en haut, texte gris)
2. **Réalisation** : Valeur réalisée (au centre, texte coloré et gras)
3. **Taux** : Pourcentage de réalisation (en bas, texte coloré)

## Modifications Backend

### 🔧 **Requête SQL Enrichie**

**Fichier modifié :** `backend/routes/kpi.js` - Endpoint `/api/kpi/detailed-data`

**Nouvelle requête :**
```sql
SELECT 
  k.DateKPI,
  -- Réalisations
  k.Nb_RelancesEnvoyees,
  k.Mt_RelancesEnvoyees,
  k.Nb_RelancesReglees,
  k.Mt_RelancesReglees,
  k.Nb_MisesEnDemeure_Envoyees,
  k.Mt_MisesEnDemeure_Envoyees,
  k.Nb_MisesEnDemeure_Reglees,
  k.Mt_MisesEnDemeure_Reglees,
  k.Nb_Dossiers_Juridiques,
  k.Mt_Dossiers_Juridiques,
  k.Nb_Coupures,
  k.Mt_Coupures,
  k.Nb_Retablissements,
  k.Mt_Retablissements,
  k.Nb_Compteurs_Remplaces,
  k.Encaissement_Journalier_Global,
  k.Observation,
  a.Nom_Agence,
  c.Nom_Centre,
  -- Objectifs
  o.Obj_Encaissement,
  o.Obj_Relances,
  o.Obj_MisesEnDemeure,
  o.Obj_Dossiers_Juridiques,
  o.Obj_Coupures,
  o.Obj_Controles,
  o.Obj_Compteurs_Remplaces
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
ORDER BY k.DateKPI ASC
```

**Améliorations :**
- ✅ **Jointure avec les objectifs** : Récupération des objectifs pour chaque date
- ✅ **Consolidation par date** : Une ligne par date avec toutes les données
- ✅ **Données complètes** : Objectifs + Réalisations + Métadonnées

## Modifications Frontend

### 🎨 **Structure du Tableau Consolidé**

**Fichier modifié :** `frontend/src/pages/BilansDetailles.js`

**Nouvelle structure :**
```javascript
<table className="min-w-full text-xs">
  <thead className="bg-gradient-to-r from-green-50 to-emerald-50 text-gray-700">
    <tr>
      <th>Date</th>
      <th>Encaissement</th>
      <th>Relances</th>
      <th>Mises en Demeure</th>
      <th>Dossiers Juridiques</th>
      <th>Coupures</th>
      <th>Rétablissements</th>
      <th>Compteurs</th>
    </tr>
    <tr className="bg-gray-100">
      <th></th>
      <th>Objectif | Réalisation</th>
      <th>Objectif | Réalisation</th>
      <th>Objectif | Réalisation</th>
      <th>Objectif | Réalisation</th>
      <th>Objectif | Réalisation</th>
      <th>Objectif | Réalisation</th>
      <th>Objectif | Réalisation</th>
    </tr>
  </thead>
  <tbody>
    {detailedData.map((data, index) => (
      <tr key={data.DateKPI}>
        <td>{new Date(data.DateKPI).toLocaleDateString('fr-FR')}</td>
        {/* Colonnes consolidées avec objectifs et réalisations */}
      </tr>
    ))}
  </tbody>
</table>
```

### 📊 **Format d'Affichage par Colonne**

**Exemple pour la colonne Encaissement :**
```javascript
<td className="px-3 py-2 text-center">
  <div className="space-y-1">
    <div className="text-xs text-gray-500">Objectif: {formatCurrency(data.Obj_Encaissement || 0)}</div>
    <div className="text-sm font-bold text-emerald-700">{formatCurrency(data.Encaissement_Journalier_Global || 0)}</div>
    <div className="text-xs text-emerald-600">
      {data.Obj_Encaissement > 0 ? 
        `${Math.round((data.Encaissement_Journalier_Global / data.Obj_Encaissement) * 100)}%` : 
        '0%'
      }
    </div>
  </div>
</td>
```

**Éléments d'affichage :**
1. **Objectif** : `text-xs text-gray-500` (petit, gris)
2. **Réalisation** : `text-sm font-bold text-[color]-700` (moyen, gras, coloré)
3. **Taux** : `text-xs text-[color]-600` (petit, coloré)

## Logique de Consolidation

### 🔄 **Processus de Consolidation**

1. **Récupération des données** : Une ligne par date avec toutes les catégories
2. **Jointure des objectifs** : Association des objectifs pour chaque date
3. **Calcul des taux** : Taux de réalisation par catégorie et par jour
4. **Affichage consolidé** : Une ligne par date avec toutes les informations

### 📈 **Calcul des Taux de Performance**

**Formule :**
```
Taux (%) = (Réalisation / Objectif) × 100
```

**Exemples :**
- Encaissement : (Encaissement réalisé / Objectif encaissement) × 100
- Relances : (Relances envoyées / Objectif relances) × 100
- Mises en Demeure : (Mises en demeure envoyées / Objectif mises en demeure) × 100

### 🎯 **Gestion des Cas Spéciaux**

1. **Pas d'objectif défini** : Taux affiché à 0%
2. **Objectif à zéro** : Évite la division par zéro
3. **Données manquantes** : Affichage de 0 avec formatage approprié
4. **Rétablissements** : Pas d'objectif (affichage de "-")

## Avantages de la Consolidation

### ✅ **Bénéfices Utilisateur**

1. **Vue d'ensemble** : Toutes les données d'une journée sur une ligne
2. **Comparaison facile** : Objectifs vs Réalisations côte à côte
3. **Taux de performance** : Calcul automatique et affichage immédiat
4. **Navigation simplifiée** : Moins de lignes, plus de clarté

### 📊 **Bénéfices Techniques**

1. **Performance** : Moins de lignes à afficher
2. **Lisibilité** : Structure horizontale plus intuitive
3. **Maintenance** : Code plus simple et organisé
4. **Évolutivité** : Facile d'ajouter de nouvelles catégories

## Validation et Tests

### 🧪 **Script de Test : `test-consolidated-data.js`**

**Tests implémentés :**
1. **Structure consolidée** : Vérification d'une ligne par date
2. **Objectifs et réalisations** : Présence des données requises
3. **Calculs de taux** : Validation des calculs de performance
4. **Scénarios multiples** : Tests avec différentes périodes

**Critères de validation :**
- ✅ **Une ligne par date** : Consolidation correcte
- ✅ **Objectifs présents** : Données d'objectifs récupérées
- ✅ **Réalisations présentes** : Données de réalisation récupérées
- ✅ **Calculs corrects** : Taux de performance calculés correctement

### 📋 **Exemple de Données Consolidées**

```json
{
  "DateKPI": "2024-12-01",
  "Obj_Encaissement": 100000.00,
  "Encaissement_Journalier_Global": 75000.00,
  "Obj_Relances": 50,
  "Nb_RelancesEnvoyees": 35,
  "Obj_MisesEnDemeure": 20,
  "Nb_MisesEnDemeure_Envoyees": 15,
  "Obj_Dossiers_Juridiques": 10,
  "Nb_Dossiers_Juridiques": 8,
  "Obj_Coupures": 30,
  "Nb_Coupures": 25,
  "Nb_Retablissements": 12,
  "Obj_Compteurs_Remplaces": 5,
  "Nb_Compteurs_Remplaces": 3
}
```

**Résultat d'affichage :**
- Encaissement : 100 000 DA → 75 000 DA (75%)
- Relances : 50 → 35 (70%)
- Mises en Demeure : 20 → 15 (75%)
- Dossiers Juridiques : 10 → 8 (80%)
- Coupures : 30 → 25 (83%)
- Rétablissements : - → 12
- Compteurs : 5 → 3 (60%)

## Conclusion

### ✅ **Consolidation Réussie**

La modification apporte :

1. **Structure optimisée** : Une ligne par date avec toutes les catégories
2. **Données complètes** : Objectifs + Réalisations + Taux de performance
3. **Affichage clair** : Format horizontal intuitif
4. **Performance améliorée** : Moins de lignes, plus d'informations

### 🎯 **Résultat Final**

Le tableau "Données Détaillées par Agence" affiche maintenant :
- **Une ligne par date** consolidant toutes les catégories
- **Objectifs et réalisations** côte à côte pour chaque métrique
- **Taux de performance** calculés automatiquement
- **Structure horizontale** plus lisible et intuitive

La consolidation respecte entièrement la spécification demandée et offre une vue d'ensemble claire et complète des performances de l'agence sélectionnée.
