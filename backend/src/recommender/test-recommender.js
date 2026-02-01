/**
 * Script de prueba del modelo de recomendación
 * Ejecutar con: node backend/src/recommender/test-recommender.js
 */

const { getActiveModel } = require('./modelManager');
const { getAllExercisesFromJSON } = require('../services/exerciseService');

async function testRecommender() {
  console.log('🧪 Iniciando prueba del modelo de recomendación...\n');
  
  try {
    // 1. Obtener modelo activo
    const model = getActiveModel();
    console.log('✅ Modelo activo:', model.config.modelVersion);
    console.log('   Descripción:', model.config.description);
    console.log('');
    
    // 2. Cargar ejercicios
    const exercises = getAllExercisesFromJSON();
    console.log('✅ Ejercicios cargados:', exercises.length);
    console.log('');
    
    // 3. Prueba 1: Planificación individual enfocada en tiro
    console.log('📋 Prueba 1: Planificación individual - Foco en tiro');
    const plan1 = await model.generatePlan(exercises, {
      goals: ['shooting', 'ball_handling'],
      constraints: {
        equipment: ['balon', 'canasta', 'conos']
      },
      profile: {
        intensity: 'medium',
        sessionDurationMinutes: 90
      },
      numberOfSessions: 3
    });
    
    console.log('   Sesiones generadas:', plan1.sessions.length);
    console.log('   Total ejercicios:', plan1.summary.totalExercises);
    console.log('   Duración total:', plan1.summary.totalDurationMinutes, 'minutos');
    
    // Mostrar primera sesión
    const session1 = plan1.sessions[0];
    console.log('\n   Primera sesión (Sesión ' + session1.sessionIndex + '):');
    session1.exercises.forEach((ex, idx) => {
      console.log(`     ${idx + 1}. [${ex.phase}] ${ex.name} - ${ex.durationMinutes}min (score: ${ex.score?.toFixed(2)})`);
    });
    console.log('');
    
    // 4. Prueba 2: Planificación enfocada en defensa
    console.log('📋 Prueba 2: Planificación individual - Foco en defensa');
    const plan2 = await model.generatePlan(exercises, {
      goals: ['defense', 'conditioning'],
      constraints: {
        equipment: ['balon', 'canasta', 'conos', 'petos']
      },
      profile: {
        intensity: 'high',
        sessionDurationMinutes: 120
      },
      numberOfSessions: 2
    });
    
    console.log('   Sesiones generadas:', plan2.sessions.length);
    console.log('   Total ejercicios:', plan2.summary.totalExercises);
    console.log('   Duración total:', plan2.summary.totalDurationMinutes, 'minutos');
    console.log('');
    
    // 5. Prueba 3: Planificación con equipamiento limitado
    console.log('📋 Prueba 3: Planificación con equipamiento limitado');
    const plan3 = await model.generatePlan(exercises, {
      goals: ['fundamentals'],
      constraints: {
        equipment: ['balon', 'canasta']
      },
      profile: {
        intensity: 'low',
        sessionDurationMinutes: 60
      },
      numberOfSessions: 2
    });
    
    console.log('   Sesiones generadas:', plan3.sessions.length);
    console.log('   Total ejercicios:', plan3.summary.totalExercises);
    console.log('   Variedad de ejercicios:', plan3.summary.exerciseVariety);
    console.log('');
    
    // 6. Probar derivación de etiquetas
    console.log('📋 Prueba 4: Derivación de etiquetas desde objetivos');
    const tags1 = model.deriveRelevantTags(['shooting']);
    console.log('   Objetivo "shooting" →', tags1.slice(0, 5).join(', '), '...');
    
    const tags2 = model.deriveRelevantTags(['pick_and_roll']);
    console.log('   Objetivo "pick_and_roll" →', tags2.join(', '));
    
    const tags3 = model.deriveRelevantTags(['mejorar tiro', 'trabajar defensa']);
    console.log('   Objetivos mixtos →', tags3.slice(0, 8).join(', '), '...');
    console.log('');
    
    console.log('✅ Todas las pruebas completadas exitosamente!\n');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar pruebas
testRecommender().then(() => {
  console.log('🎉 Prueba finalizada');
  process.exit(0);
});
