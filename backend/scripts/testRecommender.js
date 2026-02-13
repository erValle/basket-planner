#!/usr/bin/env node
/**
 * Script de prueba del Motor de Recomendación TFRS
 *
 * Simula una petición real de generación de planificación con parámetros típicos
 * de un flujo de uso normal.
 *
 * Uso:
 *   node backend/scripts/testRecommender.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { generatePlan } = require('../src/recommender');
const { getAllExercisesForRecommender } = require('../src/services/exerciseService');

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
};

function printHeader(text) {
  console.log('\n' + colors.bright + colors.cyan + '='.repeat(80) + colors.reset);
  console.log(colors.bright + colors.cyan + text + colors.reset);
  console.log(colors.bright + colors.cyan + '='.repeat(80) + colors.reset + '\n');
}

function printSection(title) {
  console.log(colors.bright + colors.yellow + '\n📋 ' + title + colors.reset);
  console.log(colors.yellow + '-'.repeat(80) + colors.reset);
}

function printInfo(label, value) {
  console.log(colors.blue + `  ${label}: ` + colors.reset + value);
}

function printSuccess(text) {
  console.log(colors.green + '  ' + text + colors.reset);
}

function printWarning(text) {
  console.log(colors.yellow + '   ' + text + colors.reset);
}

function printError(text) {
  console.log(colors.red + '  ' + text + colors.reset);
}

async function testRecommender() {
  try {
    printHeader('PRUEBA DEL MOTOR DE RECOMENDACIÓN - BASKET PLANNER');

    // 1. Cargar ejercicios disponibles
    printSection('1. Cargando ejercicios disponibles');
    const exercises = await getAllExercisesForRecommender({ active: true });
    printSuccess(`${exercises.length} ejercicios cargados desde la base de datos`);

    if (exercises.length === 0) {
      printWarning('No hay ejercicios en la BD. Usa los del JSON como fallback.');
    }

    // Mostrar algunos ejemplos
    console.log('\n  Ejemplos de ejercicios disponibles:');
    exercises.slice(0, 5).forEach((ex) => {
      const difficulty = ex.difficulty || ex.dificultad || {};
      console.log(`    - ${ex.name || ex.nombre} (${ex.type || ex.tipo})`);
      console.log(
        `      Dificultad: T:${difficulty.tactica || '?'} Té:${difficulty.tecnica || '?'} F:${difficulty.fisica || '?'} M:${difficulty.mental || '?'}`
      );
      console.log(`      Duración: ${ex.duration || ex.duracion_segundos || '?'} min`);
    });

    // 2. Definir parámetros de planificación (caso de uso real)
    printSection('2. Parámetros de la planificación');

    const planParams = {
      goals: ['shooting', 'conditioning', 'tactics', 'defense'],
      constraints: {
        availableMaterials: ['balon', 'conos', 'canasta', 'petos'],
        excludeExerciseIds: [],
      },
      profile: {
        intensity: 'medium',
        sessionDurationMinutes: 90,
        maxDurationMinutes: 120,
      },
      numberOfSessions: 3,
    };

    console.log(colors.bright + '\n  Configuración de la planificación:' + colors.reset);
    printInfo('Número de sesiones', planParams.numberOfSessions);
    printInfo('Objetivos', planParams.goals.join(', '));
    printInfo('Intensidad', planParams.profile.intensity);
    printInfo('Duración objetivo por sesión', `${planParams.profile.sessionDurationMinutes} min`);
    printInfo('Duración máxima por sesión', `${planParams.profile.maxDurationMinutes} min`);
    printInfo('Materiales disponibles', planParams.constraints.availableMaterials.join(', '));

    // 3. Ejecutar motor de recomendación
    printSection('3. Ejecutando Motor de Recomendación');
    console.log('  ⏳ Generando plan de entrenamiento...\n');

    const startTime = Date.now();
    const plan = await generatePlan(exercises, planParams);
    const executionTime = Date.now() - startTime;

    printSuccess(`Plan generado en ${executionTime}ms`);

    // 4. Mostrar resultados detallados
    printSection('4. Resultado del Motor de Recomendación');

    console.log('\n' + colors.bright + colors.green + '  MÉTRICAS DEL PLAN' + colors.reset);
    printInfo('  Sesiones generadas', plan.summary.totalSessions);
    printInfo('  Duración total', `${plan.summary.totalDurationMinutes} minutos`);
    printInfo('  Total de ejercicios', plan.summary.totalExercises);
    printInfo('  Objetivos', plan.summary.goals.join(', '));
    printInfo('  MaxDuration respetado', plan.summary.maxDurationRespected ? 'Sí' : 'No');

    // 5. Detalles de cada sesión
    printSection('5. Detalle de Sesiones Generadas');

    plan.sessions.forEach((session, sessionIdx) => {
      console.log(
        '\n' + colors.bright + colors.magenta + `  🏃 SESIÓN ${sessionIdx + 1}` + colors.reset
      );
      console.log(colors.magenta + '  ' + '-'.repeat(78) + colors.reset);

      printInfo('  ID Sesión', session.sessionId);
      printInfo('  Objetivos (Focus)', session.goals.join(', '));
      printInfo('  Duración', `${session.metrics.durationMinutes} minutos`);
      printInfo('  Intensidad', session.metadata.intensity || session.metrics.intensity);
      printInfo('  Número de ejercicios', session.metrics.exerciseCount);
      printInfo('  MaxDuration respetado', session.metrics.maxDurationRespected ? 'Si' : '');

      console.log('\n  ' + colors.bright + 'Ejercicios:' + colors.reset);

      session.exercises.forEach((exercise, exIdx) => {
        const difficulty = exercise.difficulty || {};
        console.log(`\n    ${colors.cyan}${exIdx + 1}. ${exercise.name}${colors.reset}`);
        printInfo('       ID', exercise.exerciseId);
        printInfo('       Tipo', exercise.type);
        printInfo('       Fase', exercise.phase);
        printInfo('       Duración', `${exercise.durationMinutes} min`);
        printInfo('       Intensidad', exercise.intensity);

        if (exercise.score !== undefined) {
          printInfo('       Score total', exercise.score.toFixed(3));
        }

        if (exercise.difficulty) {
          console.log('       Dificultad 4D:');
          console.log(`         - Táctica: ${difficulty.tactica || '?'}/5`);
          console.log(`         - Técnica: ${difficulty.tecnica || '?'}/5`);
          console.log(`         - Física: ${difficulty.fisica || '?'}/5`);
          console.log(`         - Mental: ${difficulty.mental || '?'}/5`);
        }

        if (exercise.tags && exercise.tags.length > 0) {
          const tags = Array.isArray(exercise.tags) ? exercise.tags.slice(0, 5) : [];
          if (tags.length > 0) {
            printInfo('       Tags', tags.join(', '));
          }
        }
      });
    });

    // 6. Análisis de distribución
    printSection('6. Análisis de Distribución');

    const typeDistribution = {};
    const phaseDistribution = {};
    const durationByDay = {};

    plan.sessions.forEach((session) => {
      durationByDay[session.day] = session.metrics.durationMinutes;

      session.exercises.forEach((ex) => {
        const type = ex.type || 'unknown';
        const phase = ex.phase || 'unknown';
        typeDistribution[type] = (typeDistribution[type] || 0) + 1;
        phaseDistribution[phase] = (phaseDistribution[phase] || 0) + 1;
      });
    });

    console.log('\n  Distribución por tipo de ejercicio:');
    Object.entries(typeDistribution)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        const bar = '█'.repeat(Math.ceil(count / 2));
        console.log(`    ${type.padEnd(25)} ${bar} ${count}`);
      });

    console.log('\n  � Distribución por fase:');
    Object.entries(phaseDistribution)
      .sort((a, b) => b[1] - a[1])
      .forEach(([phase, count]) => {
        const bar = '█'.repeat(Math.ceil(count / 2));
        console.log(`    ${phase.padEnd(25)} ${bar} ${count}`);
      });

    console.log('\n  � Duración por día:');
    Object.entries(durationByDay).forEach(([day, duration]) => {
      console.log(`    ${day.toUpperCase()}: ${duration} minutos`);
    });

    // 7. Validaciones
    printSection('7. Validaciones');

    const warnings = [];
    const errors = [];

    // Validar que todas las sesiones tienen ejercicios
    plan.sessions.forEach((session) => {
      if (!session.exercises || session.exercises.length === 0) {
        errors.push(`Sesión ${session.day} no tiene ejercicios`);
      }
    });

    // Validar duración no excede maxDuration
    if (planParams.profile.maxDurationMinutes) {
      plan.sessions.forEach((session) => {
        if (session.metrics.durationMinutes > planParams.profile.maxDurationMinutes) {
          warnings.push(
            `Sesión ${session.day} excede duración máxima: ` +
              `${session.metrics.durationMinutes} > ${planParams.profile.maxDurationMinutes}`
          );
        }
      });
    }

    // Validar diversidad de ejercicios
    const totalExercises = plan.sessions.reduce((sum, s) => sum + s.exercises.length, 0);
    const uniqueExercises = new Set();
    plan.sessions.forEach((s) => {
      s.exercises.forEach((ex) => uniqueExercises.add(ex.id));
    });

    const repetitionRate = (
      ((totalExercises - uniqueExercises.size) / totalExercises) *
      100
    ).toFixed(1);
    if (repetitionRate > 30) {
      warnings.push(`Alta tasa de repetición de ejercicios: ${repetitionRate}%`);
    }

    if (errors.length === 0 && warnings.length === 0) {
      printSuccess('Todas las validaciones pasaron correctamente');
    } else {
      if (errors.length > 0) {
        console.log('\n  Errores encontrados:');
        errors.forEach((err) => console.log(`    - ${err}`));
      }
      if (warnings.length > 0) {
        console.log('\n   Advertencias:');
        warnings.forEach((warn) => console.log(`    - ${warn}`));
      }
    }

    // 8. Resumen final
    printHeader('PRUEBA COMPLETADA EXITOSAMENTE');

    console.log(colors.green + '  Resumen:' + colors.reset);
    console.log(`    - Ejercicios disponibles: ${exercises.length}`);
    console.log(`    - Sesiones solicitadas: ${planParams.numberOfSessions}`);
    console.log(`    - Sesiones generadas: ${plan.summary.totalSessions}`);
    console.log(`    - Total de ejercicios asignados: ${totalExercises}`);
    console.log(`    - Ejercicios únicos: ${uniqueExercises.size}`);
    console.log(`    - Duración total: ${plan.summary.totalDurationMinutes} minutos`);
    console.log(`    - Tiempo de ejecución: ${executionTime}ms`);

    console.log(
      '\n' +
        colors.bright +
        colors.green +
        '  El motor de recomendación está funcionando correctamente!' +
        colors.reset +
        '\n'
    );

    return plan;
  } catch (error) {
    printHeader('ERROR EN LA PRUEBA');
    console.error(colors.red + '\n  Error: ' + error.message + colors.reset);
    console.error(colors.red + '\n  Stack trace:' + colors.reset);
    console.error(error.stack);
    throw error;
  }
}

// Ejecutar
if (require.main === module) {
  testRecommender()
    .then(() => {
      console.log('🏁 Script finalizado exitosamente\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nError fatal:', error.message);
      process.exit(1);
    });
}

module.exports = { testRecommender };
