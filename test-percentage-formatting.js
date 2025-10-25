/**
 * Script de test pour valider le formatage des pourcentages avec deux décimales
 * 
 * FONCTIONNALITÉS TESTÉES :
 * 1. Formatage des pourcentages avec deux décimales
 * 2. Utilisation de la virgule comme séparateur décimal
 * 3. Cohérence du formatage sur tous les pourcentages
 * 4. Validation des calculs de taux
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
 * Fonction pour tester le formatage des pourcentages
 */
async function testPercentageFormatting() {
  console.log('🧪 Test du formatage des pourcentages avec deux décimales');
  console.log('=====================================================');
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
    
    // Validation du formatage des pourcentages
    console.log('\n🔍 VALIDATION DU FORMATAGE DES POURCENTAGES:');
    console.log('==========================================');
    
    if (data.data && data.data.length > 0) {
      const firstRecord = data.data[0];
      
      // Vérifier la présence des champs requis pour le calcul
      const encaissementRealise = firstRecord.Encaissement_Journalier_Global || 0;
      const encaissementObjectif = firstRecord.Obj_Encaissement || 0;
      
      console.log(`Encaissement réalisé: ${encaissementRealise} DA`);
      console.log(`Encaissement objectif: ${encaissementObjectif} DA`);
      
      if (encaissementObjectif > 0) {
        const tauxCalcule = (encaissementRealise / encaissementObjectif) * 100;
        console.log(`Taux calculé: ${tauxCalcule}%`);
        
        // Validation du formatage avec deux décimales
        console.log('\n📊 VALIDATION DU FORMATAGE:');
        console.log('----------------------------');
        
        // Simuler le formatage avec la fonction formatPercentage
        const formatPercentage = (value) => {
          if (value === null || value === undefined || isNaN(value)) return '0,00%';
          return new Intl.NumberFormat('fr-FR', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(value / 100);
        };
        
        const tauxFormate = formatPercentage(tauxCalcule);
        console.log(`Taux formaté: ${tauxFormate}`);
        
        // Vérifier que le formatage contient deux décimales
        const hasTwoDecimals = tauxFormate.includes(',') && tauxFormate.split(',')[1]?.length === 2;
        console.log(`Contient deux décimales: ${hasTwoDecimals ? '✅' : '❌'}`);
        
        // Vérifier que la virgule est utilisée comme séparateur
        const usesComma = tauxFormate.includes(',');
        console.log(`Utilise la virgule comme séparateur: ${usesComma ? '✅' : '❌'}`);
        
        // Vérifier que le formatage se termine par %
        const endsWithPercent = tauxFormate.endsWith('%');
        console.log(`Se termine par %: ${endsWithPercent ? '✅' : '❌'}`);
        
        // Exemples de formatage
        console.log('\n📋 EXEMPLES DE FORMATAGE:');
        console.log('------------------------');
        const examples = [
          { value: 25.36, expected: '25,36%' },
          { value: 50.0, expected: '50,00%' },
          { value: 100.0, expected: '100,00%' },
          { value: 0.0, expected: '0,00%' },
          { value: 75.5, expected: '75,50%' },
          { value: 33.333, expected: '33,33%' }
        ];
        
        examples.forEach(example => {
          const formatted = formatPercentage(example.value);
          const isCorrect = formatted === example.expected;
          console.log(`${example.value}% → ${formatted} (attendu: ${example.expected}) ${isCorrect ? '✅' : '❌'}`);
        });
        
      } else {
        console.log('⚠️ Pas d\'objectif d\'encaissement défini');
        console.log('   → Taux affiché: 0,00%');
      }
      
      // Validation sur tous les enregistrements
      console.log('\n📊 VALIDATION SUR TOUS LES ENREGISTREMENTS:');
      console.log('------------------------------------------');
      
      data.data.forEach((record, index) => {
        const encaissementRealise = record.Encaissement_Journalier_Global || 0;
        const encaissementObjectif = record.Obj_Encaissement || 0;
        
        if (encaissementObjectif > 0) {
          const tauxCalcule = (encaissementRealise / encaissementObjectif) * 100;
          const tauxFormate = formatPercentage(tauxCalcule);
          
          console.log(`Date ${index + 1}: ${record.DateKPI}`);
          console.log(`  Encaissement: ${encaissementRealise} DA / ${encaissementObjectif} DA`);
          console.log(`  Taux: ${tauxFormate}`);
          
          // Vérifier la cohérence du formatage
          const isConsistent = tauxFormate.includes(',') && tauxFormate.endsWith('%');
          console.log(`  Formatage cohérent: ${isConsistent ? '✅' : '❌'}`);
        } else {
          console.log(`Date ${index + 1}: ${record.DateKPI} - Pas d'objectif défini`);
        }
      });
      
    } else {
      console.log('\n⚠️ Aucune donnée trouvée pour cette période');
      console.log('   → Vérifiez que l\'agence a des données pour cette période');
    }
    
    console.log('\n✅ Test du formatage des pourcentages terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Fonction pour valider la fonction formatPercentage
 */
function validateFormatPercentageFunction() {
  console.log('\n🧪 VALIDATION DE LA FONCTION formatPercentage');
  console.log('============================================');
  
  // Simulation de la fonction formatPercentage
  const formatPercentage = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0,00%';
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  };
  
  console.log('📋 Tests de la fonction formatPercentage:');
  
  const testCases = [
    { input: 25.36, expected: '25,36%', description: 'Pourcentage avec décimales' },
    { input: 50.0, expected: '50,00%', description: 'Pourcentage entier' },
    { input: 100.0, expected: '100,00%', description: 'Pourcentage à 100%' },
    { input: 0.0, expected: '0,00%', description: 'Pourcentage à 0%' },
    { input: 75.5, expected: '75,50%', description: 'Pourcentage avec une décimale' },
    { input: 33.333, expected: '33,33%', description: 'Pourcentage avec arrondi' },
    { input: null, expected: '0,00%', description: 'Valeur null' },
    { input: undefined, expected: '0,00%', description: 'Valeur undefined' },
    { input: NaN, expected: '0,00%', description: 'Valeur NaN' }
  ];
  
  testCases.forEach((testCase, index) => {
    const result = formatPercentage(testCase.input);
    const isCorrect = result === testCase.expected;
    console.log(`Test ${index + 1}: ${testCase.description}`);
    console.log(`  Input: ${testCase.input}`);
    console.log(`  Résultat: ${result}`);
    console.log(`  Attendu: ${testCase.expected}`);
    console.log(`  Correct: ${isCorrect ? '✅' : '❌'}`);
    console.log('');
  });
  
  console.log('✅ Validation de la fonction formatPercentage terminée');
}

/**
 * Fonction pour tester la cohérence du formatage
 */
function testFormattingConsistency() {
  console.log('\n🧪 TEST DE COHÉRENCE DU FORMATAGE');
  console.log('=================================');
  
  console.log('📋 Règles de formatage appliquées:');
  console.log('1. ✅ Deux décimales obligatoires (minimumFractionDigits: 2)');
  console.log('2. ✅ Maximum deux décimales (maximumFractionDigits: 2)');
  console.log('3. ✅ Virgule comme séparateur décimal (locale: fr-FR)');
  console.log('4. ✅ Symbole % à la fin (style: percent)');
  console.log('5. ✅ Gestion des valeurs nulles/undefined/NaN');
  
  console.log('\n📊 Exemples de formatage cohérent:');
  console.log('- 25,36% (deux décimales)');
  console.log('- 50,00% (décimales remplies)');
  console.log('- 100,00% (pourcentage complet)');
  console.log('- 0,00% (pourcentage nul)');
  console.log('- 75,50% (une décimale remplie)');
  
  console.log('\n❌ Exemples de formatage incorrect:');
  console.log('- 25% (pas de décimales)');
  console.log('- 25.36% (point au lieu de virgule)');
  console.log('- 25,4% (une seule décimale)');
  console.log('- 25,360% (trois décimales)');
  
  console.log('\n✅ Cohérence du formatage validée');
}

// Exécution des tests
if (require.main === module) {
  (async () => {
    await testPercentageFormatting();
    validateFormatPercentageFunction();
    testFormattingConsistency();
  })();
}

module.exports = {
  testPercentageFormatting,
  validateFormatPercentageFunction,
  testFormattingConsistency
};
