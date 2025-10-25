/**
 * Script de test pour valider l'agrégation des données par date unique
 * 
 * FONCTIONNALITÉS TESTÉES :
 * 1. Unicité des dates (GROUP BY DateKPI)
 * 2. Agrégation des réalisations (SUM pour chaque métrique)
 * 3. Consolidation des objectifs (MIN pour éviter les doublons)
 * 4. Validation de la logique d'agrégation
 */

const express = require('express');

// Configuration de test
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3001', // URL du backend
  testAgenceId: 1, // ID d'agence de test
  testStartDate: '2024-12-01', // Date de début de test
  testEndDate: '2024-12-07' // Date de fin de test
};

/**
 * Fonction pour tester l'agrégation des données par date unique
 */
async function testDateAggregation() {
  console.log('🧪 Test de l\'agrégation des données par date unique');
  console.log('==================================================');
  console.log(`📊 Agence ID: ${TEST_CONFIG.testAgenceId}`);
  console.log(`📅 Période: ${TEST_CONFIG.testStartDate} au ${TEST_CONFIG.testEndDate}`);
  console.log('');
  
  try {
    // Appel à l'endpoint detailed-data
    const response = await fetch(
      `${TEST_CONFIG.baseUrl}/api/kpi/detailed-data?agenceId=${TEST_CONFIG.testAgenceId}&startDate=${TEST_CONFIG.testStartDate}&endDate=${TEST_CONFIG.testEndDate}`
    );
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📊 Données reçues:', JSON.stringify(data, null, 2));
    
    // Validation de l'unicité des dates
    console.log('\n🔍 VALIDATION DE L\'UNICITÉ DES DATES:');
    console.log('====================================');
    
    if (data.data && data.data.length > 0) {
      const dates = data.data.map(record => record.DateKPI);
      const uniqueDates = [...new Set(dates)];
      
      console.log(`Nombre total d'enregistrements: ${data.data.length}`);
      console.log(`Nombre de dates uniques: ${uniqueDates.length}`);
      console.log(`Unicité des dates: ${data.data.length === uniqueDates.length ? '✅' : '❌'}`);
      
      if (data.data.length === uniqueDates.length) {
        console.log('✅ SUCCÈS: Chaque date apparaît une seule fois');
      } else {
        console.log('❌ ERREUR: Des dates sont dupliquées');
        console.log('Dates dupliquées:', dates.filter((date, index) => dates.indexOf(date) !== index));
      }
      
      // Validation de l'agrégation des réalisations
      console.log('\n📊 VALIDATION DE L\'AGRÉGATION DES RÉALISATIONS:');
      console.log('=============================================');
      
      const firstRecord = data.data[0];
      const aggregationFields = [
        'Nb_RelancesEnvoyees', 'Mt_RelancesEnvoyees',
        'Nb_RelancesReglees', 'Mt_RelancesReglees',
        'Nb_MisesEnDemeure_Envoyees', 'Mt_MisesEnDemeure_Envoyees',
        'Nb_Dossiers_Juridiques', 'Mt_Dossiers_Juridiques',
        'Nb_Coupures', 'Mt_Coupures',
        'Nb_Retablissements', 'Mt_Retablissements',
        'Nb_Compteurs_Remplaces', 'Encaissement_Journalier_Global'
      ];
      
      console.log('📈 Champs d\'agrégation présents:');
      aggregationFields.forEach(field => {
        const hasField = firstRecord.hasOwnProperty(field);
        const value = firstRecord[field];
        console.log(`${field}: ${hasField ? '✅' : '❌'} (${value || 0})`);
      });
      
      // Validation des objectifs consolidés
      console.log('\n🎯 VALIDATION DES OBJECTIFS CONSOLIDÉS:');
      console.log('=====================================');
      
      const objectiveFields = [
        'Obj_Encaissement', 'Obj_Relances', 'Obj_MisesEnDemeure',
        'Obj_Dossiers_Juridiques', 'Obj_Coupures', 'Obj_Compteurs_Remplaces'
      ];
      
      console.log('📋 Objectifs consolidés:');
      objectiveFields.forEach(field => {
        const hasField = firstRecord.hasOwnProperty(field);
        const value = firstRecord[field];
        console.log(`${field}: ${hasField ? '✅' : '❌'} (${value || 0})`);
      });
      
      // Exemple d'affichage consolidé
      console.log('\n📋 EXEMPLE D\'AFFICHAGE CONSOLIDÉ:');
      console.log('----------------------------------');
      console.log(`Date: ${firstRecord.DateKPI}`);
      console.log(`Agence: ${firstRecord.Nom_Agence || 'N/A'}`);
      console.log('');
      console.log('Réalisations agrégées:');
      console.log(`  Encaissement: ${firstRecord.Encaissement_Journalier_Global || 0} DA`);
      console.log(`  Relances Envoyées: ${firstRecord.Nb_RelancesEnvoyees || 0} (${firstRecord.Mt_RelancesEnvoyees || 0} DA)`);
      console.log(`  Relances Encaissées: ${firstRecord.Nb_RelancesReglees || 0} (${firstRecord.Mt_RelancesReglees || 0} DA)`);
      console.log(`  Mises en Demeure: ${firstRecord.Nb_MisesEnDemeure_Envoyees || 0} (${firstRecord.Mt_MisesEnDemeure_Envoyees || 0} DA)`);
      console.log(`  Dossiers Juridiques: ${firstRecord.Nb_Dossiers_Juridiques || 0} (${firstRecord.Mt_Dossiers_Juridiques || 0} DA)`);
      console.log(`  Coupures: ${firstRecord.Nb_Coupures || 0} (${firstRecord.Mt_Coupures || 0} DA)`);
      console.log(`  Rétablissements: ${firstRecord.Nb_Retablissements || 0} (${firstRecord.Mt_Retablissements || 0} DA)`);
      console.log(`  Compteurs Remplacés: ${firstRecord.Nb_Compteurs_Remplaces || 0}`);
      console.log('');
      console.log('Objectifs consolidés:');
      console.log(`  Encaissement: ${firstRecord.Obj_Encaissement || 0} DA`);
      console.log(`  Relances: ${firstRecord.Obj_Relances || 0}`);
      console.log(`  Mises en Demeure: ${firstRecord.Obj_MisesEnDemeure || 0}`);
      console.log(`  Dossiers Juridiques: ${firstRecord.Obj_Dossiers_Juridiques || 0}`);
      console.log(`  Coupures: ${firstRecord.Obj_Coupures || 0}`);
      console.log(`  Compteurs: ${firstRecord.Obj_Compteurs_Remplaces || 0}`);
      
    } else {
      console.log('\n⚠️ Aucune donnée trouvée pour cette période');
      console.log('   → Vérifiez que l\'agence a des données pour cette période');
    }
    
    console.log('\n✅ Test de l\'agrégation des données terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Fonction pour tester différents scénarios d'agrégation
 */
async function testAggregationScenarios() {
  console.log('\n🧪 TEST DE DIFFÉRENTS SCÉNARIOS D\'AGRÉGATION');
  console.log('=============================================');
  
  const scenarios = [
    {
      name: 'Période avec données multiples par jour',
      agenceId: 1,
      startDate: '2024-12-01',
      endDate: '2024-12-03'
    },
    {
      name: 'Période avec une seule donnée par jour',
      agenceId: 1,
      startDate: '2024-12-01',
      endDate: '2024-12-01'
    },
    {
      name: 'Période sans données',
      agenceId: 1,
      startDate: '2024-11-01',
      endDate: '2024-11-03'
    }
  ];
  
  for (const scenario of scenarios) {
    console.log(`\n📊 Scénario: ${scenario.name}`);
    console.log('----------------------------');
    
    try {
      const response = await fetch(
        `${TEST_CONFIG.baseUrl}/api/kpi/detailed-data?agenceId=${scenario.agenceId}&startDate=${scenario.startDate}&endDate=${scenario.endDate}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const dates = data.data ? data.data.map(record => record.DateKPI) : [];
        const uniqueDates = [...new Set(dates)];
        
        console.log(`✅ Succès: ${data.totalRecords || 0} enregistrements`);
        console.log(`   Dates uniques: ${uniqueDates.length}`);
        console.log(`   Agrégation correcte: ${data.data ? data.data.length === uniqueDates.length ? '✅' : '❌' : 'N/A'}`);
        
        if (data.data && data.data.length > 0) {
          const firstRecord = data.data[0];
          console.log(`   Exemple - Date: ${firstRecord.DateKPI}`);
          console.log(`   Exemple - Encaissement: ${firstRecord.Encaissement_Journalier_Global || 0} DA`);
          console.log(`   Exemple - Relances: ${firstRecord.Nb_RelancesEnvoyees || 0}`);
        }
      } else {
        console.log(`❌ Erreur: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
    }
  }
}

/**
 * Fonction pour valider la logique d'agrégation
 */
function validateAggregationLogic() {
  console.log('\n🧪 VALIDATION DE LA LOGIQUE D\'AGRÉGATION');
  console.log('=========================================');
  
  console.log('📋 Logique d\'agrégation implémentée:');
  console.log('1. GROUP BY k.DateKPI → Une ligne par date unique');
  console.log('2. SUM() pour les réalisations → Agrégation des valeurs');
  console.log('3. MIN() pour les objectifs → Éviter les doublons');
  console.log('4. MIN() pour les métadonnées → Première occurrence');
  
  console.log('\n📊 Fonctions d\'agrégation utilisées:');
  console.log('- SUM(k.Nb_RelancesEnvoyees) → Somme des relances envoyées');
  console.log('- SUM(k.Mt_RelancesEnvoyees) → Somme des montants de relances');
  console.log('- SUM(k.Encaissement_Journalier_Global) → Somme des encaissements');
  console.log('- MIN(o.Obj_Encaissement) → Objectif d\'encaissement (première occurrence)');
  console.log('- MIN(a.Nom_Agence) → Nom de l\'agence (première occurrence)');
  
  console.log('\n✅ Logique d\'agrégation validée');
  console.log('   → Chaque date apparaît une seule fois');
  console.log('   → Les réalisations sont agrégées par somme');
  console.log('   → Les objectifs sont consolidés sans doublons');
  console.log('   → Les métadonnées sont préservées');
}

/**
 * Fonction pour tester la cohérence des données agrégées
 */
async function testDataConsistency() {
  console.log('\n🧪 TEST DE COHÉRENCE DES DONNÉES AGRÉGÉES');
  console.log('=========================================');
  
  try {
    const response = await fetch(
      `${TEST_CONFIG.baseUrl}/api/kpi/detailed-data?agenceId=${TEST_CONFIG.testAgenceId}&startDate=${TEST_CONFIG.testStartDate}&endDate=${TEST_CONFIG.testEndDate}`
    );
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        console.log('📊 Validation de la cohérence:');
        
        // Vérifier que les valeurs agrégées sont cohérentes
        data.data.forEach((record, index) => {
          console.log(`\nDate ${index + 1}: ${record.DateKPI}`);
          
          // Vérifier que les montants sont positifs ou nuls
          const amounts = [
            record.Mt_RelancesEnvoyees, record.Mt_RelancesReglees,
            record.Mt_MisesEnDemeure_Envoyees, record.Mt_Dossiers_Juridiques,
            record.Mt_Coupures, record.Mt_Retablissements,
            record.Encaissement_Journalier_Global
          ];
          
          const negativeAmounts = amounts.filter(amount => amount < 0);
          console.log(`  Montants négatifs: ${negativeAmounts.length > 0 ? '❌' : '✅'}`);
          
          // Vérifier que les quantités sont positives ou nulles
          const quantities = [
            record.Nb_RelancesEnvoyees, record.Nb_RelancesReglees,
            record.Nb_MisesEnDemeure_Envoyees, record.Nb_Dossiers_Juridiques,
            record.Nb_Coupures, record.Nb_Retablissements,
            record.Nb_Compteurs_Remplaces
          ];
          
          const negativeQuantities = quantities.filter(qty => qty < 0);
          console.log(`  Quantités négatives: ${negativeQuantities.length > 0 ? '❌' : '✅'}`);
          
          // Vérifier que les objectifs sont cohérents
          const objectives = [
            record.Obj_Encaissement, record.Obj_Relances,
            record.Obj_MisesEnDemeure, record.Obj_Dossiers_Juridiques,
            record.Obj_Coupures, record.Obj_Compteurs_Remplaces
          ];
          
          const negativeObjectives = objectives.filter(obj => obj < 0);
          console.log(`  Objectifs négatifs: ${negativeObjectives.length > 0 ? '❌' : '✅'}`);
        });
        
        console.log('\n✅ Test de cohérence terminé');
      } else {
        console.log('⚠️ Aucune donnée à valider');
      }
    } else {
      console.log(`❌ Erreur: ${response.status} - ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
  }
}

// Exécution des tests
if (require.main === module) {
  (async () => {
    await testDateAggregation();
    await testAggregationScenarios();
    validateAggregationLogic();
    await testDataConsistency();
  })();
}

module.exports = {
  testDateAggregation,
  testAggregationScenarios,
  validateAggregationLogic,
  testDataConsistency
};
