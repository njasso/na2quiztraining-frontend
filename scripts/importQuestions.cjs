// scripts/importQuestions.cjs
const axios = require('axios');
const readline = require('readline');

const API_URL = 'http://localhost:5000/api';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function getQuestions() {
  const module = await import('../src/data/questionsData.js');
  return module.default;
}

async function importQuestions() {
  console.log('📡 Connexion à:', `${API_URL}/questions/save`);
  
  const questionsData = await getQuestions();
  console.log(`📊 Total questions chargées: ${questionsData.length}`);

  // FORMAT avec les DEUX champs (question pour la route, text pour Mongoose)
  const formattedQuestions = questionsData.map(q => ({
    // Pour la validation de la route
    question: q.question,
    subject: q.matiere,
    level: q.niveau,
    
    // Pour le modèle Mongoose
    text: q.question,      // Même contenu que question
    options: q.options,
    correctAnswer: q.correctAnswer,
    domain: q.domaine,
    points: q.points || 1,
    explanation: q.explanation || '',
    type: 'single'
    // 'sousDomaine' ignoré
  }));

  console.log(`\n📝 Exemple de question formatée (première question):`);
  console.log(JSON.stringify(formattedQuestions[0], null, 2));

  // Vérification des deux validations
  const allValid = formattedQuestions.every(q => 
    q.question && q.text && q.options && q.correctAnswer && q.subject && q.level
  );
  
  console.log(`\n🔍 Validation: ${allValid ? '✅ TOUTES VALIDES' : '❌ CERTAINES INVALIDES'}`);

  rl.question('\n✅ Continuer ? (oui/non): ', async (answer) => {
    if (answer.toLowerCase() !== 'oui') {
      console.log('❌ Import annulé');
      rl.close();
      return;
    }

    rl.question('\n🔑 Entrez votre token: ', async (token) => {
      console.log(`\n📦 Début de l'import de ${formattedQuestions.length} questions...`);

      const batchSize = 100;
      const batches = [];
      
      for (let i = 0; i < formattedQuestions.length; i += batchSize) {
        batches.push(formattedQuestions.slice(i, i + batchSize));
      }

      console.log(`📦 Division en ${batches.length} lots de ${batchSize} questions`);

      let totalSuccess = 0;
      let totalFailed = 0;

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`\n📦 Lot ${i + 1}/${batches.length} (${batch.length} questions)...`);

        try {
          const response = await axios.post(
            `${API_URL}/questions/save`,
            { questions: batch },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.data.success) {
            totalSuccess += batch.length;
            console.log(`  ✅ Lot ${i + 1} importé avec succès: ${response.data.message}`);
            
            const percent = ((totalSuccess / formattedQuestions.length) * 100).toFixed(1);
            console.log(`  📊 Progression: ${totalSuccess}/${formattedQuestions.length} (${percent}%)`);
          } else {
            totalFailed += batch.length;
            console.log(`  ❌ Échec lot ${i + 1}:`, response.data.error);
          }
        } catch (error) {
          totalFailed += batch.length;
          if (error.response) {
            console.log(`  ❌ Erreur lot ${i + 1}:`, error.response.data.error || error.response.status);
            if (error.response.data.details) {
              console.log('     Détails:', error.response.data.details);
            }
          } else {
            console.log(`  ❌ Erreur lot ${i + 1}:`, error.message);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log('\n📊 RÉSULTATS FINAUX:');
      console.log('═══════════════════════');
      console.log(`✅ Importées avec succès: ${totalSuccess}`);
      console.log(`❌ Échouées: ${totalFailed}`);
      console.log(`📝 Total traité: ${formattedQuestions.length}`);
      
      rl.close();
    });
  });
}

// Version de test
async function testImport() {
  console.log('🔍 MODE TEST - 5 questions');
  
  const questionsData = await getQuestions();
  const testQuestions = questionsData.slice(0, 5).map(q => ({
    // Pour la route
    question: q.question,
    subject: q.matiere,
    level: q.niveau,
    
    // Pour Mongoose
    text: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    domain: q.domaine,
    points: q.points || 1,
    explanation: q.explanation || '',
    type: 'single'
  }));

  console.log('\n📝 Questions de test:');
  testQuestions.forEach((q, i) => {
    console.log(`${i + 1}. ${q.question.substring(0, 50)}...`);
    console.log(`   ${q.domain} > ${q.level} > ${q.subject}`);
  });

  // Vérification
  const isValid = testQuestions.every(q => 
    q.question && q.text && q.options && q.correctAnswer && q.subject && q.level
  );
  console.log(`\n🔍 Validation: ${isValid ? '✅ OK' : '❌ PAS OK'}`);

  console.log('\n📤 Structure envoyée (première question):');
  console.log(JSON.stringify(testQuestions[0], null, 2));

  rl.question('\n🔑 Token pour le test: ', async (token) => {
    try {
      const response = await axios.post(
        `${API_URL}/questions/save`,
        { questions: testQuestions },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('\n✅ TEST RÉUSSI !');
      console.log('Résultat:', response.data);
      
    } catch (error) {
      console.error('\n❌ TEST ÉCHOUÉ:');
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Message:', error.response.data);
      } else {
        console.error(error.message);
      }
    }
    rl.close();
  });
}

// Menu
console.log('\n📚 IMPORT DE QUESTIONS');
console.log('══════════════════════');
console.log('1. 🔍 Tester (5 questions)');
console.log('2. 📦 Importer tout (7000)');
console.log('3. 🚪 Quitter');

rl.question('\n📌 Choix: ', (choice) => {
  if (choice === '1') testImport();
  else if (choice === '2') importQuestions();
  else rl.close();
});