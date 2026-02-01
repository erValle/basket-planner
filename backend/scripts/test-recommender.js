/**
 * Script para probar el modelo de recomendación directamente
 * Ejecutar: node scripts/test-recommender.js
 */

require('dotenv').config();

// Usar la configuración de sequelize existente
const db = require('../models');

async function testRecommender() {
  console.log('🧪 Iniciando test del modelo de recomendación...\n');
  
  try {
    // Conectar a la BD
    await db.sequelize.authenticate();
    console.log('✅ Conexión a BD establecida\n');
    
    // Cargar el recomendador
    const recommender = require('../src/recommender/recommender');
    const { getAllExercisesForRecommender } = require('../src/services/exerciseService');
    
    // Obtener ejercicios
    console.log('📚 Cargando ejercicios...');
    const exercises = await getAllExercisesForRecommender({ active: true });
    console.log(`   Total ejercicios: ${exercises.length}\n`);
    
    if (exercises.length === 0) {
      console.error('❌ No hay ejercicios disponibles');
      process.exit(1);
    }
    
    // Inicializar modelo
    console.log('🔧 Inicializando modelo TFRS...');
    const startInit = Date.now();
    await recommender.initializeModel(exercises, true);
    console.log(`   Modelo inicializado en ${Date.now() - startInit}ms`);
    
    const modelInfo = recommender.getModelInfo();
    console.log(`   Versión: ${modelInfo.version}`);
    console.log(`   Entrenado: ${modelInfo.isTrained}`);
    console.log('');
    
    // Test 1: Generación simple (1 objetivo, 2 sesiones)
    console.log('═══════════════════════════════════════════════════════════');
    console.log('TEST 1: Generación simple (1 objetivo, 2 sesiones)');
    console.log('═══════════════════════════════════════════════════════════');
    
    const test1Params = {
      goals: ['Mejora del tiro exterior'],
      constraints: {},
      profile: {
        intensity: 'medium',
        sessionDurationMinutes: 60,
        maxDurationMinutes: 60
      },
      numberOfSessions: 2
    };
    
    console.log('Parámetros:', JSON.stringify(test1Params, null, 2));
    console.log('\nGenerando...');
    
    const start1 = Date.now();
    const result1 = await recommender.generatePlan(exercises, test1Params);
    const time1 = Date.now() - start1;
    
    console.log(`\n✅ Completado en ${time1}ms`);
    console.log(`   Sesiones generadas: ${result1.sessions.length}/${test1Params.numberOfSessions}`);
    console.log(`   Ejercicios totales: ${result1.summary.totalExercises}`);
    console.log(`   Duración total: ${result1.summary.totalDurationMinutes} min`);
    console.log(`   Abortado: ${result1.wasAborted || false}`);
    
    // Mostrar detalle de cada sesión
    result1.sessions.forEach((session, idx) => {
      console.log(`\n   Sesión ${idx + 1}:`);
      console.log(`     - Ejercicios: ${session.exercises.length}`);
      console.log(`     - Duración: ${session.metrics.durationMinutes} min`);
      console.log(`     - Fases: ${[...new Set(session.exercises.map(e => e.phase))].join(', ')}`);
    });
    
    // Test 2: Generación con múltiples objetivos y etiquetas
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('TEST 2: Generación con objetivo y etiquetas (3 sesiones)');
    console.log('═══════════════════════════════════════════════════════════');
    
    const test2Params = {
      goals: ['Mejora del tiro exterior'],
      constraints: {
        tags: ['tiro', 'técnica', 'calentamiento']
      },
      profile: {
        intensity: 'medium',
        sessionDurationMinutes: 75,
        maxDurationMinutes: 75
      },
      numberOfSessions: 3
    };
    
    console.log('Parámetros:', JSON.stringify(test2Params, null, 2));
    console.log('\nGenerando...');
    
    const start2 = Date.now();
    const result2 = await recommender.generatePlan(exercises, test2Params);
    const time2 = Date.now() - start2;
    
    console.log(`\n✅ Completado en ${time2}ms`);
    console.log(`   Sesiones generadas: ${result2.sessions.length}/${test2Params.numberOfSessions}`);
    console.log(`   Ejercicios totales: ${result2.summary.totalExercises}`);
    console.log(`   Duración total: ${result2.summary.totalDurationMinutes} min`);
    console.log(`   Abortado: ${result2.wasAborted || false}`);
    
    result2.sessions.forEach((session, idx) => {
      console.log(`\n   Sesión ${idx + 1}:`);
      console.log(`     - Ejercicios: ${session.exercises.length}`);
      console.log(`     - Duración: ${session.metrics.durationMinutes} min`);
      const phases = {};
      session.exercises.forEach(e => {
        phases[e.phase] = (phases[e.phase] || 0) + 1;
      });
      console.log(`     - Por fase: ${Object.entries(phases).map(([k,v]) => `${k}(${v})`).join(', ')}`);
    });
    
    // Test 3: Con AbortSignal (simular timeout)
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('TEST 3: Generación con timeout corto (5 sesiones, abort en 2s)');
    console.log('═══════════════════════════════════════════════════════════');
    
    const test3Params = {
      goals: ['Mejora del tiro exterior', 'Fundamentos técnicos'],
      constraints: {},
      profile: {
        intensity: 'high',
        sessionDurationMinutes: 90,
        maxDurationMinutes: 90
      },
      numberOfSessions: 5
    };
    
    console.log('Parámetros:', JSON.stringify(test3Params, null, 2));
    console.log('\nGenerando con timeout de 2 segundos...');
    
    const abortController = new AbortController();
    setTimeout(() => {
      console.log('   ⏱️ Timeout! Abortando...');
      abortController.abort();
    }, 2000);
    
    const start3 = Date.now();
    const result3 = await recommender.generatePlan(exercises, test3Params, { 
      signal: abortController.signal 
    });
    const time3 = Date.now() - start3;
    
    console.log(`\n${result3.wasAborted ? '⚠️' : '✅'} Completado en ${time3}ms`);
    console.log(`   Sesiones generadas: ${result3.sessions.length}/${test3Params.numberOfSessions}`);
    console.log(`   Abortado: ${result3.wasAborted || false}`);
    
    if (result3.sessions.length > 0) {
      result3.sessions.forEach((session, idx) => {
        console.log(`\n   Sesión ${idx + 1}:`);
        console.log(`     - Ejercicios: ${session.exercises.length}`);
        console.log(`     - Duración: ${session.metrics.durationMinutes} min`);
      });
    }
    
    // Resumen
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('RESUMEN DE TESTS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Test 1 (simple): ${result1.sessions.length}/${test1Params.numberOfSessions} sesiones en ${time1}ms`);
    console.log(`Test 2 (etiquetas): ${result2.sessions.length}/${test2Params.numberOfSessions} sesiones en ${time2}ms`);
    console.log(`Test 3 (abort): ${result3.sessions.length}/${test3Params.numberOfSessions} sesiones en ${time3}ms (abortado: ${result3.wasAborted})`);
    
    const avgTimePerSession = ((time1/test1Params.numberOfSessions) + (time2/test2Params.numberOfSessions)) / 2;
    console.log(`\nTiempo promedio por sesión: ~${Math.round(avgTimePerSession)}ms`);
    
    console.log('\n✅ Tests completados');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

testRecommender();
