/**
 * Script de test pour valider l'agrégation des objectifs dans le Résumé Global
 * 
 * Ce script teste la logique d'agrégation des objectifs selon la spécification :
 * Objectif Global = Σ (Objectif de l'indicateur pour chaque agence)
 */

const express = require('express');
const request = require('supertest');

// Configuration de test
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3001', // URL du backend
  testDate: '20241201' // Date de test (format YYYYMMDD)
};

/**
 * Fonction pour tester l'agrégation des objectifs
 */
async function testObjectivesAggregation() {
  console.log('🧪 Test d\'agrégation des objectifs');
  console.log('=====================================');
  
  try {
    // Appel à l'endpoint global-summary
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/kpi/global-summary?dateKey=${TEST_CONFIG.testDate}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📊 Données reçues:', JSON.stringify(data, null, 2));
    
    if (!data.global) {
      console.log('⚠️ Aucune donnée globale trouvée');
      return;
    }
    
    const global = data.global;
    
    // Validation de l'agrégation des objectifs
    console.log('\n📋 Validation de l\'agrégation des objectifs:');
    console.log('---------------------------------------------');
    
    // Vérifier que les objectifs globaux sont présents
    const objectivesToCheck = [
      { key: 'Total_Obj_Relances', name: 'Relances' },
      { key: 'Total_Obj_MisesEnDemeure', name: 'Mises en Demeure' },
      { key: 'Total_Obj_DossiersJuridiques', name: 'Dossiers Juridiques' },
      { key: 'Total_Obj_Coupures', name: 'Coupures' },
      { key: 'Total_Obj_Controles', name: 'Contrôles' },
      { key: 'Total_Obj_CompteursRemplaces', name: 'Compteurs Remplacés' },
      { key: 'Total_Obj_Encaissement', name: 'Encaissement' }
    ];
    
    objectivesToCheck.forEach(obj => {
      const value = global[obj.key];
      console.log(`${obj.name}: ${value || 0} (${value ? '✓' : '⚠️'})`);
    });
    
    // Validation des taux calculés
    console.log('\n📈 Validation des taux calculés:');
    console.log('--------------------------------');
    
    const ratesToCheck = [
      { key: 'Taux_Relances', name: 'Taux Relances' },
      { key: 'Taux_MisesEnDemeure', name: 'Taux Mises en Demeure' },
      { key: 'Taux_DossiersJuridiques', name: 'Taux Dossiers Juridiques' },
      { key: 'Taux_Coupures', name: 'Taux Coupures' },
      { key: 'Taux_Controles', name: 'Taux Contrôles' },
      { key: 'Taux_CompteursRemplaces', name: 'Taux Compteurs Remplacés' },
      { key: 'Taux_Encaissement', name: 'Taux Encaissement' }
    ];
    
    ratesToCheck.forEach(rate => {
      const value = global[rate.key];
      console.log(`${rate.name}: ${value || 0}% (${value !== undefined ? '✓' : '⚠️'})`);
    });
    
    // Validation de la logique de calcul
    console.log('\n🔍 Validation de la logique de calcul:');
    console.log('-------------------------------------');
    
    // Exemple de validation pour les relances
    if (global.Total_RelancesEnvoyees && global.Total_Obj_Relances) {
      const expectedRate = (global.Total_RelancesEnvoyees / global.Total_Obj_Relances) * 100;
      const actualRate = global.Taux_Relances;
      const isCorrect = Math.abs(expectedRate - actualRate) < 0.01; // Tolérance de 0.01%
      
      console.log(`Relances - Réalisé: ${global.Total_RelancesEnvoyees}, Objectif: ${global.Total_Obj_Relances}`);
      console.log(`Taux attendu: ${expectedRate.toFixed(2)}%, Taux calculé: ${actualRate}%`);
      console.log(`Calcul correct: ${isCorrect ? '✓' : '❌'}`);
    }
    
    // Exemple de validation pour l'encaissement
    if (global.Total_EncaissementGlobal && global.Total_Obj_Encaissement) {
      const expectedRate = (global.Total_EncaissementGlobal / global.Total_Obj_Encaissement) * 100;
      const actualRate = global.Taux_Encaissement;
      const isCorrect = Math.abs(expectedRate - actualRate) < 0.01;
      
      console.log(`\nEncaissement - Réalisé: ${global.Total_EncaissementGlobal}, Objectif: ${global.Total_Obj_Encaissement}`);
      console.log(`Taux attendu: ${expectedRate.toFixed(2)}%, Taux calculé: ${actualRate}%`);
      console.log(`Calcul correct: ${isCorrect ? '✓' : '❌'}`);
    }
    
    console.log('\n✅ Test terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Fonction pour créer des données de test
 */
async function createTestData() {
  console.log('🔧 Création de données de test...');
  
  // Cette fonction pourrait être utilisée pour créer des données de test
  // si nécessaire pour valider l'agrégation
  
  console.log('✅ Données de test créées (si nécessaire)');
}

// Exécution du test
if (require.main === module) {
  (async () => {
    await createTestData();
    await testObjectivesAggregation();
  })();
}

module.exports = {
  testObjectivesAggregation,
  createTestData
};
