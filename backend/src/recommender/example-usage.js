/**
 * Ejemplo de uso del modelo de recomendación
 * Muestra cómo generar diferentes tipos de planificaciones
 */

const { getActiveModel } = require('./modelManager');
const { getAllExercisesFromJSON } = require('../services/exerciseService');

async function ejemploUso() {
  console.log('Ejemplos de Uso del Modelo de Recomendación\n');
  console.log('='.repeat(60) + '\n');

  // Cargar modelo y ejercicios
  const model = getActiveModel();
  const exercises = getAllExercisesFromJSON();

  console.log(`Modelo: ${model.config.modelVersion}`);
  console.log(`Ejercicios disponibles: ${exercises.length}\n`);

  // ========================================
  // EJEMPLO 1: Fundamentos con intensidad baja
  // ========================================
  console.log('EJEMPLO 1: Trabajando fundamentos - intensidad baja');
  console.log('-'.repeat(60));

  const plan1 = model.generatePlan(exercises, {
    goals: ['fundamentals', 'ball_handling'],
    constraints: {
      equipment: ['balon', 'canasta', 'conos'],
    },
    profile: {
      intensity: 'low',
      sessionDurationMinutes: 60,
    },
    numberOfSessions: 2,
  });

  console.log(`Generadas ${plan1.sessions.length} sesiones`);
  console.log(`   Duración total: ${plan1.summary.totalDurationMinutes} minutos`);
  console.log(`   Ejercicios: ${plan1.summary.totalExercises}\n`);

  // Mostrar ejemplo de sesión
  const session1 = plan1.sessions[0];
  console.log(`   Sesión 1:`);
  session1.exercises.slice(0, 5).forEach((ex, i) => {
    console.log(`      ${i + 1}. ${ex.name} (${ex.phase}) - ${ex.durationMinutes}min`);
  });
  console.log(`      ... y ${session1.exercises.length - 5} ejercicios más\n`);

  // ========================================
  // EJEMPLO 2: Tiro especializado - intensidad alta
  // ========================================
  console.log('EJEMPLO 2: Entrenamiento especializado de tiro - intensidad alta');
  console.log('-'.repeat(60));

  const plan2 = model.generatePlan(exercises, {
    goals: ['shooting', 'conditioning'],
    constraints: {
      equipment: ['balon', 'canasta', 'conos', 'rebotador_o_companero'],
    },
    profile: {
      intensity: 'high',
      sessionDurationMinutes: 120,
    },
    numberOfSessions: 4,
  });

  console.log(`Generadas ${plan2.sessions.length} sesiones`);
  console.log(`   Duración total: ${plan2.summary.totalDurationMinutes} minutos`);
  console.log(`   Intensidad: alta`);

  // Contar ejercicios de tiro
  const shootingExercises = plan2.sessions
    .flatMap((s) => s.exercises)
    .filter((ex) => ex.tags?.some((t) => t.includes('tiro')));
  console.log(`   Ejercicios de tiro: ${shootingExercises.length}\n`);

  // ========================================
  // EJEMPLO 3: Planificación con equipamiento limitado
  // ========================================
  console.log('EJEMPLO 3: Equipamiento mínimo - solo balón y canasta');
  console.log('-'.repeat(60));

  const plan3 = model.generatePlan(exercises, {
    goals: ['shooting', 'passing'],
    constraints: {
      equipment: ['balon', 'canasta'],
    },
    profile: {
      intensity: 'low',
      sessionDurationMinutes: 75,
    },
    numberOfSessions: 3,
  });

  console.log(`Generadas ${plan3.sessions.length} sesiones`);
  console.log(`   Total ejercicios: ${plan3.summary.totalExercises}`);
  console.log(`   Variedad: ${plan3.summary.exerciseVariety}\n`);

  // ========================================
  // EJEMPLO 4: Equipo completo - Pick & Roll
  // ========================================
  console.log('EJEMPLO 4: Equipo trabajando Pick & Roll y táctica');
  console.log('-'.repeat(60));

  const plan4 = model.generatePlan(exercises, {
    goals: ['pick_and_roll', 'tactics', 'defense'],
    constraints: {
      equipment: ['balon', 'canasta', 'conos', 'petos'],
    },
    profile: {
      intensity: 'medium',
      sessionDurationMinutes: 90,
    },
    numberOfSessions: 3,
  });

  console.log(`Generadas ${plan4.sessions.length} sesiones`);

  // Contar ejercicios tácticos
  const tacticalEx = plan4.sessions
    .flatMap((s) => s.exercises)
    .filter(
      (ex) =>
        ex.phase === 'tactical' ||
        ex.tags?.some((t) => t.includes('pick_and_roll') || t.includes('tactica'))
    );
  console.log(`   Ejercicios tácticos/PnR: ${tacticalEx.length}`);
  console.log(`   Ideal para trabajo de equipo\n`);

  // ========================================
  // INFORMACIÓN ADICIONAL
  // ========================================
  console.log('='.repeat(60));
  console.log('Información del Modelo\n');

  console.log('Objetivos soportados:');
  Object.keys(model.config.goalToTags).forEach((goal) => {
    console.log(`   - ${goal}`);
  });

  console.log('\nNiveles soportados: beginner, intermediate, advanced');
  console.log('Intensidades: low, medium, high');

  console.log('\nTodos los ejemplos ejecutados correctamente');
  console.log('\nPara usar el modelo en tu código:');
  console.log('  const model = getActiveModel();');
  console.log('  const plan = model.generatePlan(exercises, params);');
}

// Ejecutar ejemplos
ejemploUso().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
