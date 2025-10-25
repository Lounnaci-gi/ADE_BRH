/**
 * Script de test pour valider les nouveaux filtres par date et par agence
 * 
 * FONCTIONNALITÉS TESTÉES :
 * 1. Filtres par intervalle de dates (startDate, endDate)
 * 2. Filtre par agence spécifique
 * 3. Affichage des données détaillées par jour pour l'agence sélectionnée
 * 4. Tableau de suivi journalier
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
 * Fonction pour tester l'endpoint detailed-data
 */
async function testDetailedDataEndpoint() {
  console.log('🧪 Test de l\'endpoint detailed-data');
  console.log('===================================');
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
    
    // Validation de la structure de réponse
    console.log('\n🔍 VALIDATION DE LA STRUCTURE DE RÉPONSE:');
    console.log('=========================================');
    
    // Vérifier les champs requis
    const requiredFields = ['data', 'agenceId', 'startDate', 'endDate', 'totalRecords'];
    requiredFields.forEach(field => {
      const hasField = data.hasOwnProperty(field);
      console.log(`${field}: ${hasField ? '✅' : '❌'}`);
    });
    
    // Vérifier le type de données
    console.log('\n📋 VALIDATION DES TYPES DE DONNÉES:');
    console.log('------------------------------------');
    console.log(`data (array): ${Array.isArray(data.data) ? '✅' : '❌'}`);
    console.log(`agenceId (number): ${typeof data.agenceId === 'number' ? '✅' : '❌'}`);
    console.log(`totalRecords (number): ${typeof data.totalRecords === 'number' ? '✅' : '❌'}`);
    
    // Vérifier les données si disponibles
    if (data.data && data.data.length > 0) {
      console.log('\n📊 VALIDATION DES DONNÉES JOURNALIÈRES:');
      console.log('--------------------------------------');
      
      const firstRecord = data.data[0];
      const requiredDataFields = [
        'DateKPI', 'Nb_RelancesEnvoyees', 'Mt_RelancesEnvoyees',
        'Nb_RelancesReglees', 'Mt_RelancesReglees',
        'Nb_MisesEnDemeure_Envoyees', 'Mt_MisesEnDemeure_Envoyees',
        'Nb_Dossiers_Juridiques', 'Mt_Dossiers_Juridiques',
        'Nb_Coupures', 'Mt_Coupures',
        'Nb_Retablissements', 'Mt_Retablissements',
        'Nb_Compteurs_Remplaces', 'Encaissement_Journalier_Global'
      ];
      
      requiredDataFields.forEach(field => {
        const hasField = firstRecord.hasOwnProperty(field);
        console.log(`${field}: ${hasField ? '✅' : '❌'}`);
      });
      
      // Afficher un exemple de données
      console.log('\n📋 EXEMPLE DE DONNÉES:');
      console.log('----------------------');
      console.log(`Date: ${firstRecord.DateKPI}`);
      console.log(`Agence: ${firstRecord.Nom_Agence || 'N/A'}`);
      console.log(`Relances Envoyées: ${firstRecord.Nb_RelancesEnvoyees || 0}`);
      console.log(`Montant Relances: ${firstRecord.Mt_RelancesEnvoyees || 0} DA`);
      console.log(`Encaissement: ${firstRecord.Encaissement_Journalier_Global || 0} DA`);
      
    } else {
      console.log('\n⚠️ Aucune donnée trouvée pour cette période');
      console.log('   → Vérifiez que l\'agence a des données pour cette période');
    }
    
    // Validation de la cohérence des dates
    console.log('\n📅 VALIDATION DE LA COHÉRENCE DES DATES:');
    console.log('----------------------------------------');
    console.log(`Date de début demandée: ${data.startDate}`);
    console.log(`Date de fin demandée: ${data.endDate}`);
    console.log(`Agence demandée: ${data.agenceId}`);
    console.log(`Nombre d'enregistrements: ${data.totalRecords}`);
    
    if (data.data && data.data.length > 0) {
      const dates = data.data.map(record => record.DateKPI).sort();
      console.log(`Première date trouvée: ${dates[0]}`);
      console.log(`Dernière date trouvée: ${dates[dates.length - 1]}`);
      
      // Vérifier que toutes les dates sont dans la plage demandée
      const startDate = new Date(TEST_CONFIG.testStartDate);
      const endDate = new Date(TEST_CONFIG.testEndDate);
      const allDatesInRange = dates.every(date => {
        const recordDate = new Date(date);
        return recordDate >= startDate && recordDate <= endDate;
      });
      
      console.log(`Toutes les dates dans la plage: ${allDatesInRange ? '✅' : '❌'}`);
    }
    
    console.log('\n✅ Test de l\'endpoint detailed-data terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Fonction pour tester différents scénarios
 */
async function testDifferentScenarios() {
  console.log('\n🧪 TEST DE DIFFÉRENTS SCÉNARIOS');
  console.log('================================');
  
  const scenarios = [
    {
      name: 'Période courte (1 jour)',
      agenceId: 1,
      startDate: '2024-12-01',
      endDate: '2024-12-01'
    },
    {
      name: 'Période longue (1 mois)',
      agenceId: 1,
      startDate: '2024-12-01',
      endDate: '2024-12-31'
    },
    {
      name: 'Agence différente',
      agenceId: 2,
      startDate: '2024-12-01',
      endDate: '2024-12-07'
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
        console.log(`✅ Succès: ${data.totalRecords} enregistrements trouvés`);
      } else {
        console.log(`❌ Erreur: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
    }
  }
}

/**
 * Fonction pour tester la validation des paramètres
 */
async function testParameterValidation() {
  console.log('\n🧪 TEST DE VALIDATION DES PARAMÈTRES');
  console.log('====================================');
  
  const invalidScenarios = [
    {
      name: 'Agence manquante',
      url: `${TEST_CONFIG.baseUrl}/api/kpi/detailed-data?startDate=${TEST_CONFIG.testStartDate}&endDate=${TEST_CONFIG.testEndDate}`
    },
    {
      name: 'Date de début manquante',
      url: `${TEST_CONFIG.baseUrl}/api/kpi/detailed-data?agenceId=${TEST_CONFIG.testAgenceId}&endDate=${TEST_CONFIG.testEndDate}`
    },
    {
      name: 'Date de fin manquante',
      url: `${TEST_CONFIG.baseUrl}/api/kpi/detailed-data?agenceId=${TEST_CONFIG.testAgenceId}&startDate=${TEST_CONFIG.testStartDate}`
    },
    {
      name: 'Date invalide',
      url: `${TEST_CONFIG.baseUrl}/api/kpi/detailed-data?agenceId=${TEST_CONFIG.testAgenceId}&startDate=invalid-date&endDate=${TEST_CONFIG.testEndDate}`
    },
    {
      name: 'Date de début > Date de fin',
      url: `${TEST_CONFIG.baseUrl}/api/kpi/detailed-data?agenceId=${TEST_CONFIG.testAgenceId}&startDate=${TEST_CONFIG.testEndDate}&endDate=${TEST_CONFIG.testStartDate}`
    }
  ];
  
  for (const scenario of invalidScenarios) {
    console.log(`\n📊 Test: ${scenario.name}`);
    console.log('----------------------------');
    
    try {
      const response = await fetch(scenario.url);
      const data = await response.json();
      
      if (response.status === 400) {
        console.log(`✅ Validation correcte: ${data.message}`);
      } else {
        console.log(`❌ Validation échouée: Status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
    }
  }
}

// Exécution des tests
if (require.main === module) {
  (async () => {
    await testDetailedDataEndpoint();
    await testDifferentScenarios();
    await testParameterValidation();
  })();
}

module.exports = {
  testDetailedDataEndpoint,
  testDifferentScenarios,
  testParameterValidation
};
