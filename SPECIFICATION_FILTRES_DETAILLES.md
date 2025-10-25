# Spécification Technique : Filtres par Date et par Agence - Bilans Détaillés

## Vue d'ensemble

La page des bilans détaillés (`/bilans-detailles`) a été enrichie avec des filtres avancés permettant de consulter les données de performance par agence et par période.

## Fonctionnalités Implémentées

### 🎯 **1. Filtres par Intervalle de Dates**

**Composants UI :**
- **Date de début** : Sélecteur de date pour définir le début de la période
- **Date de fin** : Sélecteur de date pour définir la fin de la période
- **Validation** : Vérification que la date de début est antérieure à la date de fin

**Interface utilisateur :**
```javascript
// Filtre par date de début
<input
  type="date"
  value={filters.startDate}
  onChange={(e) => handleFilterChange('startDate', e.target.value)}
  className="pl-10 pr-4 py-3 text-sm border-2 border-green-200 rounded-xl..."
/>
```

### 🏢 **2. Filtre par Agence**

**Composant UI :**
- **Sélecteur d'agence** : Dropdown avec la liste de toutes les agences disponibles
- **Chargement dynamique** : Les agences sont chargées depuis l'API
- **Affichage** : Nom de l'agence avec ID en valeur

**Interface utilisateur :**
```javascript
<select
  value={filters.selectedAgence}
  onChange={(e) => handleFilterChange('selectedAgence', e.target.value)}
  className="pl-10 pr-4 py-3 text-sm border-2 border-purple-200 rounded-xl..."
>
  <option value="">Sélectionner une agence</option>
  {agences.map((agence) => (
    <option key={agence.AgenceId} value={agence.AgenceId}>
      {agence.Nom_Agence}
    </option>
  ))}
</select>
```

### 📊 **3. Tableau de Suivi Journalier**

**Fonctionnalité :**
- Affichage des données détaillées par jour pour l'agence sélectionnée
- Colonnes : Date, Relances, Mises en Demeure, Dossiers Juridiques, Coupures, etc.
- Formatage monétaire pour les montants
- Animations et transitions fluides

**Structure du tableau :**
```javascript
<table className="min-w-full text-sm">
  <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
    <tr>
      <th>Date</th>
      <th>Relances Envoyées</th>
      <th>Relances Encaissées</th>
      <th>Mises en Demeure</th>
      <th>Dossiers Juridiques</th>
      <th>Coupures</th>
      <th>Rétablissements</th>
      <th>Compteurs</th>
      <th>Encaissement</th>
    </tr>
  </thead>
  <tbody>
    {detailedData.map((data, index) => (
      <tr key={data.DateKPI}>
        <td>{new Date(data.DateKPI).toLocaleDateString('fr-FR')}</td>
        <td>
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-cyan-700">{data.Nb_RelancesEnvoyees || 0}</div>
            <div className="text-xs text-cyan-600">{formatCurrency(data.Mt_RelancesEnvoyees || 0)}</div>
          </div>
        </td>
        {/* ... autres colonnes ... */}
      </tr>
    ))}
  </tbody>
</table>
```

## Architecture Backend

### 🔧 **Endpoint API : `/api/kpi/detailed-data`**

**Méthode :** GET  
**Paramètres requis :**
- `agenceId` : ID de l'agence
- `startDate` : Date de début (format YYYY-MM-DD)
- `endDate` : Date de fin (format YYYY-MM-DD)

**Requête SQL :**
```sql
SELECT 
  k.DateKPI,
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
  c.Nom_Centre
FROM dbo.FAIT_KPI_ADE k
LEFT JOIN dbo.DIM_AGENCE a ON k.AgenceId = a.AgenceId
LEFT JOIN dbo.DIM_CENTRE c ON a.FK_Centre = c.CentreId
WHERE k.AgenceId = @agenceId 
  AND k.DateKPI >= @startDate 
  AND k.DateKPI <= @endDate
ORDER BY k.DateKPI ASC
```

**Réponse API :**
```json
{
  "data": [
    {
      "DateKPI": "2024-12-01",
      "Nb_RelancesEnvoyees": 25,
      "Mt_RelancesEnvoyees": 125000.00,
      "Nb_RelancesReglees": 15,
      "Mt_RelancesReglees": 75000.00,
      "Nb_MisesEnDemeure_Envoyees": 5,
      "Mt_MisesEnDemeure_Envoyees": 25000.00,
      "Nb_Dossiers_Juridiques": 2,
      "Mt_Dossiers_Juridiques": 10000.00,
      "Nb_Coupures": 8,
      "Mt_Coupures": 40000.00,
      "Nb_Retablissements": 3,
      "Mt_Retablissements": 15000.00,
      "Nb_Compteurs_Remplaces": 1,
      "Encaissement_Journalier_Global": 200000.00,
      "Observation": "Journée productive",
      "Nom_Agence": "Agence Centre",
      "Nom_Centre": "Centre Principal"
    }
  ],
  "agenceId": 1,
  "startDate": "2024-12-01",
  "endDate": "2024-12-07",
  "totalRecords": 7
}
```

## Architecture Frontend

### 🎨 **Composant Principal : `BilansDetailles.js`**

**États ajoutés :**
```javascript
const [filters, setFilters] = useState({
  date: new Date().toISOString().split('T')[0], // Pour le résumé global
  startDate: '', // Date de début pour les données détaillées
  endDate: '', // Date de fin pour les données détaillées
  selectedAgence: '' // Agence sélectionnée
});
const [detailedData, setDetailedData] = useState([]);
const [showDetailedView, setShowDetailedView] = useState(false);
```

**Fonction de chargement des données :**
```javascript
const loadDetailedData = async () => {
  if (!filters.startDate || !filters.endDate || !filters.selectedAgence) {
    setDetailedData([]);
    setShowDetailedView(false);
    return;
  }

  try {
    setLoading(true);
    setError(null);
    
    const response = await kpiService.getDetailedData(
      filters.selectedAgence,
      filters.startDate,
      filters.endDate
    );
    
    setDetailedData(response.data || []);
    setShowDetailedView(true);
  } catch (err) {
    console.error('Erreur lors du chargement des données détaillées:', err);
    setError('Erreur lors du chargement des données détaillées');
    setDetailedData([]);
    setShowDetailedView(false);
  } finally {
    setLoading(false);
  }
};
```

### 🔌 **Service API : `kpiService.js`**

**Méthode ajoutée :**
```javascript
async getDetailedData(agenceId, startDate, endDate) {
  const res = await api.get(`/kpi/detailed-data?agenceId=${agenceId}&startDate=${startDate}&endDate=${endDate}`);
  return res.data;
}
```

## Validation et Sécurité

### ✅ **Validation des Paramètres**

**Backend :**
- Vérification de la présence des paramètres requis
- Validation du format des dates
- Vérification que la date de début est antérieure à la date de fin
- Validation de l'existence de l'agence

**Frontend :**
- Vérification que tous les filtres sont remplis avant l'appel API
- Gestion des états de chargement et d'erreur
- Affichage conditionnel des composants

### 🔒 **Sécurité**

- Validation des types de données côté backend
- Échappement des paramètres SQL
- Gestion des erreurs avec messages appropriés
- Limitation des résultats par période (pas de limite arbitraire)

## Interface Utilisateur

### 🎨 **Design et UX**

**Filtres :**
- Interface en grille responsive (1 colonne sur mobile, 4 colonnes sur desktop)
- Couleurs distinctes pour chaque filtre (bleu, vert, rouge, violet)
- Icônes explicites pour chaque type de filtre
- Labels descriptifs pour chaque champ

**Tableau de données :**
- Design cohérent avec le reste de l'application
- Couleurs thématiques pour chaque type de métrique
- Formatage monétaire en dinars algériens (DA)
- Animations d'apparition pour les lignes du tableau

**États d'interface :**
- État de chargement avec spinner
- État d'erreur avec message explicite
- État vide avec illustration et message
- État de succès avec données affichées

## Tests et Validation

### 🧪 **Script de Test : `test-detailed-filters.js`**

**Tests implémentés :**
1. **Test de l'endpoint detailed-data** : Validation de la structure de réponse
2. **Test de différents scénarios** : Périodes courtes, longues, agences différentes
3. **Test de validation des paramètres** : Gestion des cas d'erreur

**Critères de validation :**
- ✅ Structure de réponse correcte
- ✅ Types de données appropriés
- ✅ Cohérence des dates
- ✅ Gestion des erreurs
- ✅ Performance acceptable

## Utilisation

### 📋 **Processus d'utilisation**

1. **Sélection des filtres :**
   - Choisir une date de début
   - Choisir une date de fin
   - Sélectionner une agence

2. **Chargement des données :**
   - Cliquer sur "Afficher les données détaillées"
   - Attendre le chargement des données

3. **Consultation des résultats :**
   - Tableau détaillé par jour
   - Données de performance complètes
   - Formatage monétaire et numérique

### 🎯 **Cas d'usage**

- **Suivi quotidien** : Vérifier les performances d'une agence sur une période
- **Analyse comparative** : Comparer les performances entre différentes périodes
- **Rapport détaillé** : Générer un rapport de performance par agence
- **Audit** : Vérifier la cohérence des données saisies

## Conclusion

### ✅ **Fonctionnalités Implémentées**

1. **Filtres avancés** : Date de début, date de fin, sélection d'agence
2. **Tableau de suivi** : Données détaillées par jour pour l'agence sélectionnée
3. **Interface utilisateur** : Design cohérent et responsive
4. **Validation** : Gestion complète des erreurs et des cas limites
5. **Performance** : Requêtes SQL optimisées et chargement asynchrone

### 🎯 **Résultat Final**

La page `/bilans-detailles` offre maintenant :
- **Filtrage flexible** par période et par agence
- **Affichage détaillé** des performances journalières
- **Interface intuitive** avec validation en temps réel
- **Données complètes** pour l'analyse et le suivi

Les utilisateurs peuvent maintenant consulter facilement les données de performance de n'importe quelle agence sur n'importe quelle période, avec un affichage clair et détaillé des métriques de performance.
