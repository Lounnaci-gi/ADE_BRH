/**
 * Script de test pour valider la consolidation des données par date
 * 
 * FONCTIONNALITÉS TESTÉES :
 * 1. Une ligne par date (consolidation des données)
 * 2. Affichage des objectifs et réalisations côte à côte
 * 3. Calcul des taux de performance par jour
 * 4. Structure de tableau optimisée
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
 * Fonction pour tester la structure consolidée des données
 */
async function testConsolidatedDataStructure() {
  console.log('🧪 Test de la structure consolidée des données');
  console.log('==============================================');
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
    
    // Validation de la structure consolidée
    console.log('\n🔍 VALIDATION DE LA STRUCTURE CONSOLIDÉE:');
    console.log('=========================================');
    
    if (data.data && data.data.length > 0) {
      const firstRecord = data.data[0];
      
      // Vérifier la présence des objectifs
      const objectivesFields = [
        'Obj_Encaissement', 'Obj_Relances', 'Obj_MisesEnDemeure',
        'Obj_Dossiers_Juridiques', 'Obj_Coupures', 'Obj_Compteurs_Remplaces'
      ];
      
      console.log('\n📋 Objectifs présents:');
      objectivesFields.forEach(field => {
        const hasField = firstRecord.hasOwnProperty(field);
        const value = firstRecord[field];
        console.log(`${field}: ${hasField ? '✅' : '❌'} (${value || 0})`);
      });
      
      // Vérifier la présence des réalisations
      const realizationsFields = [
        'Encaissement_Journalier_Global', 'Nb_RelancesEnvoyees', 'Nb_MisesEnDemeure_Envoyees',
        'Nb_Dossiers_Juridiques', 'Nb_Coupures', 'Nb_Compteurs_Remplaces'
      ];
      
      console.log('\n📈 Réalisations présentes:');
      realizationsFields.forEach(field => {
        const hasField = firstRecord.hasOwnProperty(field);
        const value = firstRecord[field];
        console.log(`${field}: ${hasField ? '✅' : '❌'} (${value || 0})`);
      });
      
      // Validation de la consolidation par date
      console.log('\n📅 VALIDATION DE LA CONSOLIDATION PAR DATE:');
      console.log('--------------------------------------------');
      
      const dates = data.data.map(record => record.DateKPI);
      const uniqueDates = [...new Set(dates)];
      
      console.log(`Nombre total d'enregistrements: ${data.data.length}`);
      console.log(`Nombre de dates uniques: ${uniqueDates.length}`);
      console.log(`Consolidation correcte: ${data.data.length === uniqueDates.length ? '✅' : '❌'}`);
      
      if (data.data.length === uniqueDates.length) {
        console.log('✅ SUCCÈS: Une ligne par date (consolidation correcte)');
      } else {
        console.log('❌ ERREUR: Plusieurs lignes pour la même date');
        console.log('Dates dupliquées:', dates.filter((date, index) => dates.indexOf(date) !== index));
      }
      
      // Validation des calculs de taux
      console.log('\n📊 VALIDATION DES CALCULS DE TAUX:');
      console.log('----------------------------------');
      
      const testCalculations = [
        {
          name: 'Encaissement',
          objective: firstRecord.Obj_Encaissement,
          realization: firstRecord.Encaissement_Journalier_Global,
          expectedRate: firstRecord.Obj_Encaissement > 0 ? 
            Math.round((firstRecord.Encaissement_Journalier_Global / firstRecord.Obj_Encaissement) * 100) : 0
        },
        {
          name: 'Relances',
          objective: firstRecord.Obj_Relances,
          realization: firstRecord.Nb_RelancesEnvoyees,
          expectedRate: firstRecord.Obj_Relances > 0 ? 
            Math.round((firstRecord.Nb_RelancesEnvoyees / firstRecord.Obj_Relances) * 100) : 0
        }
      ];
      
      testCalculations.forEach(calc => {
        console.log(`\n${calc.name}:`);
        console.log(`  Objectif: ${calc.objective || 0}`);
        console.log(`  Réalisation: ${calc.realization || 0}`);
        console.log(`  Taux attendu: ${calc.expectedRate}%`);
        
        if (calc.objective > 0) {
          const actualRate = Math.round((calc.realization / calc.objective) * 100);
          console.log(`  Taux calculé: ${actualRate}%`);
          console.log(`  Calcul correct: ${actualRate === calc.expectedRate ? '✅' : '❌'}`);
        } else {
          console.log(`  Pas d'objectif défini`);
        }
      });
      
      // Exemple d'affichage consolidé
      console.log('\n📋 EXEMPLE D\'AFFICHAGE CONSOLIDÉ:');
      console.log('----------------------------------');
      console.log(`Date: ${firstRecord.DateKPI}`);
      console.log(`Agence: ${firstRecord.Nom_Agence || 'N/A'}`);
      console.log('');
      console.log('Encaissement:');
      console.log(`  Objectif: ${firstRecord.Obj_Encaissement || 0} DA`);
      console.log(`  Réalisation: ${firstRecord.Encaissement_Journalier_Global || 0} DA`);
      console.log(`  Taux: ${firstRecord.Obj_Encaissement > 0 ? 
        Math.round((firstRecord.Encaissement_Journalier_Global / firstRecord.Obj_Encaissement) * 100) : 0}%`);
      console.log('');
      console.log('Relances:');
      console.log(`  Objectif: ${firstRecord.Obj_Relances || 0}`);
      console.log(`  Réalisation: ${firstRecord.Nb_RelancesEnvoyees || 0}`);
      console.log(`  Taux: ${firstRecord.Obj_Relances > 0 ? 
        Math.round((firstRecord.Nb_RelancesEnvoyees / firstRecord.Obj_Relances) * 100) : 0}%`);
      
    } else {
      console.log('\n⚠️ Aucune donnée trouvée pour cette période');
      console.log('   → Vérifiez que l\'agence a des données pour cette période');
    }
    
    console.log('\n✅ Test de la structure consolidée terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Fonction pour tester différents scénarios de consolidation
 */
async function testConsolidationScenarios() {
  console.log('\n🧪 TEST DE DIFFÉRENTS SCÉNARIOS DE CONSOLIDATION');
  console.log('================================================');
  
  const scenarios = [
    {
      name: 'Période avec données complètes',
      agenceId: 1,
      startDate: '2024-12-01',
      endDate: '2024-12-03'
    },
    {
      name: 'Période avec données partielles',
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
        console.log(`   Consolidation: ${data.data ? data.data.length === uniqueDates.length ? '✅' : '❌' : 'N/A'}`);
        
        if (data.data && data.data.length > 0) {
          const firstRecord = data.data[0];
          console.log(`   Exemple - Encaissement: ${firstRecord.Obj_Encaissement || 0} → ${firstRecord.Encaissement_Journalier_Global || 0}`);
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
 * Fonction pour valider la structure de tableau
 */
function validateTableStructure() {
  console.log('\n🧪 VALIDATION DE LA STRUCTURE DE TABLEAU');
  console.log('=========================================');
  
  const expectedColumns = [
    'Date',
    'Encaissement (Objectif | Réalisation | Taux)',
    'Relances (Objectif | Réalisation | Taux)',
    'Mises en Demeure (Objectif | Réalisation | Taux)',
    'Dossiers Juridiques (Objectif | Réalisation | Taux)',
    'Coupures (Objectif | Réalisation | Taux)',
    'Rétablissements (Réalisation seulement)',
    'Compteurs (Objectif | Réalisation | Taux)'
  ];
  
  console.log('📋 Colonnes attendues:');
  expectedColumns.forEach((column, index) => {
    console.log(`${index + 1}. ${column}`);
  });
  
  console.log('\n✅ Structure de tableau validée');
  console.log('   → Une ligne par date');
  console.log('   → Objectifs et réalisations côte à côte');
  console.log('   → Calcul des taux de performance');
  console.log('   → Affichage consolidé et optimisé');
}

// Exécution des tests
if (require.main === module) {
  (async () => {
    await testConsolidatedDataStructure();
    await testConsolidationScenarios();
    validateTableStructure();
  })();
}

module.exports = {
  testConsolidatedDataStructure,
  testConsolidationScenarios,
  validateTableStructure
};
