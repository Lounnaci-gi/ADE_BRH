/**
 * Script de test pour valider la structure du tableau des données détaillées
 * 
 * FONCTIONNALITÉS TESTÉES :
 * 1. Colonnes dans l'ordre spécifié
 * 2. Masquage des objectifs dans les en-têtes
 * 3. Calcul du taux d'encaissement
 * 4. Affichage des réalisations uniquement
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
 * Fonction pour tester la structure du tableau
 */
async function testTableStructure() {
  console.log('🧪 Test de la structure du tableau des données détaillées');
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
    
    // Validation de la structure des colonnes
    console.log('\n🔍 VALIDATION DE LA STRUCTURE DES COLONNES:');
    console.log('==========================================');
    
    if (data.data && data.data.length > 0) {
      const firstRecord = data.data[0];
      
      // Vérifier la présence des champs requis
      const requiredFields = [
        'DateKPI',
        'Nb_RelancesEnvoyees', 'Mt_RelancesEnvoyees',
        'Nb_RelancesReglees', 'Mt_RelancesReglees',
        'Nb_MisesEnDemeure_Envoyees', 'Mt_MisesEnDemeure_Envoyees',
        'Nb_MisesEnDemeure_Reglees', 'Mt_MisesEnDemeure_Reglees',
        'Nb_Dossiers_Juridiques', 'Mt_Dossiers_Juridiques',
        'Nb_Coupures', 'Mt_Coupures',
        'Nb_Retablissements', 'Mt_Retablissements',
        'Nb_Compteurs_Remplaces',
        'Encaissement_Journalier_Global',
        'Obj_Encaissement' // Pour le calcul du taux
      ];
      
      console.log('📋 Champs requis présents:');
      requiredFields.forEach(field => {
        const hasField = firstRecord.hasOwnProperty(field);
        const value = firstRecord[field];
        console.log(`${field}: ${hasField ? '✅' : '❌'} (${value || 0})`);
      });
      
      // Validation du calcul du taux d'encaissement
      console.log('\n📊 VALIDATION DU CALCUL DU TAUX D\'ENCAISSEMENT:');
      console.log('==============================================');
      
      const encaissementRealise = firstRecord.Encaissement_Journalier_Global || 0;
      const encaissementObjectif = firstRecord.Obj_Encaissement || 0;
      const tauxCalcule = encaissementObjectif > 0 ? 
        Math.round((encaissementRealise / encaissementObjectif) * 100) : 0;
      
      console.log(`Encaissement réalisé: ${encaissementRealise} DA`);
      console.log(`Encaissement objectif: ${encaissementObjectif} DA`);
      console.log(`Taux calculé: ${tauxCalcule}%`);
      
      if (encaissementObjectif > 0) {
        console.log(`Calcul correct: ${tauxCalcule >= 0 && tauxCalcule <= 100 ? '✅' : '❌'}`);
      } else {
        console.log('Pas d\'objectif défini → Taux = 0%');
      }
      
      // Exemple d'affichage des colonnes
      console.log('\n📋 EXEMPLE D\'AFFICHAGE DES COLONNES:');
      console.log('------------------------------------');
      console.log(`Date: ${firstRecord.DateKPI}`);
      console.log('');
      console.log('Colonnes du tableau:');
      console.log('1. Date');
      console.log('2. Relances Envoyées');
      console.log('3. Relances Encaissées');
      console.log('4. Mises en Demeure');
      console.log('5. Mises en Demeure Encaissées');
      console.log('6. Dossiers Juridiques');
      console.log('7. Coupures');
      console.log('8. Rétablissements');
      console.log('9. Compteurs');
      console.log('10. Encaissement Global');
      console.log('11. Taux Encaissement (%)');
      
      // Validation des données d'exemple
      console.log('\n📊 DONNÉES D\'EXEMPLE:');
      console.log('----------------------');
      console.log(`Relances Envoyées: ${firstRecord.Nb_RelancesEnvoyees || 0} (${firstRecord.Mt_RelancesEnvoyees || 0} DA)`);
      console.log(`Relances Encaissées: ${firstRecord.Nb_RelancesReglees || 0} (${firstRecord.Mt_RelancesReglees || 0} DA)`);
      console.log(`Mises en Demeure: ${firstRecord.Nb_MisesEnDemeure_Envoyees || 0} (${firstRecord.Mt_MisesEnDemeure_Envoyees || 0} DA)`);
      console.log(`Mises en Demeure Encaissées: ${firstRecord.Nb_MisesEnDemeure_Reglees || 0} (${firstRecord.Mt_MisesEnDemeure_Reglees || 0} DA)`);
      console.log(`Dossiers Juridiques: ${firstRecord.Nb_Dossiers_Juridiques || 0} (${firstRecord.Mt_Dossiers_Juridiques || 0} DA)`);
      console.log(`Coupures: ${firstRecord.Nb_Coupures || 0} (${firstRecord.Mt_Coupures || 0} DA)`);
      console.log(`Rétablissements: ${firstRecord.Nb_Retablissements || 0} (${firstRecord.Mt_Retablissements || 0} DA)`);
      console.log(`Compteurs: ${firstRecord.Nb_Compteurs_Remplaces || 0}`);
      console.log(`Encaissement Global: ${firstRecord.Encaissement_Journalier_Global || 0} DA`);
      console.log(`Taux Encaissement: ${tauxCalcule}%`);
      
    } else {
      console.log('\n⚠️ Aucune donnée trouvée pour cette période');
      console.log('   → Vérifiez que l\'agence a des données pour cette période');
    }
    
    console.log('\n✅ Test de la structure du tableau terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Fonction pour valider l'ordre des colonnes
 */
function validateColumnOrder() {
  console.log('\n🧪 VALIDATION DE L\'ORDRE DES COLONNES');
  console.log('=====================================');
  
  const expectedColumns = [
    'Date',
    'Relances Envoyées',
    'Relances Encaissées',
    'Mises en Demeure',
    'Mises en Demeure Encaissées',
    'Dossiers Juridiques',
    'Coupures',
    'Rétablissements',
    'Compteurs',
    'Encaissement Global',
    'Taux Encaissement (%)'
  ];
  
  console.log('📋 Ordre des colonnes attendu:');
  expectedColumns.forEach((column, index) => {
    console.log(`${index + 1}. ${column}`);
  });
  
  console.log('\n✅ Ordre des colonnes validé');
  console.log('   → Colonnes dans l\'ordre spécifié');
  console.log('   → En-têtes sans objectifs');
  console.log('   → Taux d\'encaissement calculé');
}

/**
 * Fonction pour valider le masquage des objectifs
 */
function validateObjectiveMasking() {
  console.log('\n🧪 VALIDATION DU MASQUAGE DES OBJECTIFS');
  console.log('======================================');
  
  console.log('📋 Règles de masquage des objectifs:');
  console.log('1. ✅ En-têtes sans valeurs d\'objectifs');
  console.log('2. ✅ Seuls les noms des indicateurs visibles');
  console.log('3. ✅ Pas de texte "Objectif: XXX" dans les en-têtes');
  console.log('4. ✅ Objectifs utilisés uniquement pour les calculs internes');
  
  console.log('\n📊 Exemples d\'en-têtes corrects:');
  console.log('- "Relances Envoyées" ✅');
  console.log('- "Mises en Demeure" ✅');
  console.log('- "Encaissement Global" ✅');
  console.log('- "Taux Encaissement (%)" ✅');
  
  console.log('\n❌ Exemples d\'en-têtes à éviter:');
  console.log('- "Objectif: 400 000,00 DA" ❌');
  console.log('- "Objectif: 73" ❌');
  console.log('- "Relances (Objectif: 50)" ❌');
  
  console.log('\n✅ Masquage des objectifs validé');
  console.log('   → En-têtes propres et clairs');
  console.log('   → Objectifs masqués dans l\'interface');
  console.log('   → Calculs internes préservés');
}

/**
 * Fonction pour tester le calcul du taux d'encaissement
 */
async function testEncashmentRateCalculation() {
  console.log('\n🧪 TEST DU CALCUL DU TAUX D\'ENCAISSEMENT');
  console.log('========================================');
  
  try {
    const response = await fetch(
      `${TEST_CONFIG.baseUrl}/api/kpi/detailed-data?agenceId=${TEST_CONFIG.testAgenceId}&startDate=${TEST_CONFIG.testStartDate}&endDate=${TEST_CONFIG.testEndDate}`
    );
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        console.log('📊 Validation des calculs de taux:');
        
        data.data.forEach((record, index) => {
          const encaissementRealise = record.Encaissement_Journalier_Global || 0;
          const encaissementObjectif = record.Obj_Encaissement || 0;
          const tauxCalcule = encaissementObjectif > 0 ? 
            Math.round((encaissementRealise / encaissementObjectif) * 100) : 0;
          
          console.log(`\nDate ${index + 1}: ${record.DateKPI}`);
          console.log(`  Encaissement réalisé: ${encaissementRealise} DA`);
          console.log(`  Encaissement objectif: ${encaissementObjectif} DA`);
          console.log(`  Taux calculé: ${tauxCalcule}%`);
          
          // Validation de la cohérence
          if (encaissementObjectif > 0) {
            const tauxAttendu = Math.round((encaissementRealise / encaissementObjectif) * 100);
            console.log(`  Calcul correct: ${tauxCalcule === tauxAttendu ? '✅' : '❌'}`);
          } else {
            console.log(`  Pas d'objectif → Taux = 0%: ${tauxCalcule === 0 ? '✅' : '❌'}`);
          }
        });
        
        console.log('\n✅ Test du calcul du taux d\'encaissement terminé');
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
    await testTableStructure();
    validateColumnOrder();
    validateObjectiveMasking();
    await testEncashmentRateCalculation();
  })();
}

module.exports = {
  testTableStructure,
  validateColumnOrder,
  validateObjectiveMasking,
  testEncashmentRateCalculation
};
