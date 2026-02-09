/**
 * Script para probar el flujo completo de generación (simula HTTP request)
 * Ejecutar: node scripts/test-generation-flow.js
 */

require('dotenv').config();
const db = require('../models');

async function testGenerationFlow() {
  console.log('Iniciando test del flujo completo de generación...\n');

  try {
    await db.sequelize.authenticate();
    console.log('Conexión a BD establecida\n');

    // Importar el servicio directamente
    const planningGenerationService = require('../src/services/planningGenerationService');

    // Simular el payload que envía el frontend
    const testInput = {
      profile: {
        playerId: 1, // ID de prueba
        intensity: 'medium',
        sessionDurationMinutes: 60,
        numberOfSessions: 3,
        clubId: null,
      },
      goals: ['Mejora del tiro exterior'],
      constraints: {
        equipment: [],
      },
    };

    console.log('📤 Payload de entrada:');
    console.log(JSON.stringify(testInput, null, 2));
    console.log('\n');

    // Test 1: Sin AbortSignal
    console.log('═══════════════════════════════════════════════════════════');
    console.log('TEST 1: Generación sin AbortSignal');
    console.log('═══════════════════════════════════════════════════════════');

    const start1 = Date.now();
    try {
      const result1 = await planningGenerationService.generateIndividual(
        testInput,
        { user: { id: 1 }, requestId: 'test-1' },
        {} // Sin signal
      );

      const time1 = Date.now() - start1;
      console.log(`\nCompletado en ${time1}ms`);
      console.log(`   ID Plan: ${result1.id}`);
      console.log(`   Sesiones: ${result1.sessions?.length || 0}`);
      console.log(`   wasAborted: ${result1.wasAborted}`);
      console.log(`   partialGeneration: ${result1.partialGeneration}`);

      if (result1.sessions && result1.sessions.length > 0) {
        result1.sessions.forEach((s, i) => {
          console.log(
            `   Sesión ${i + 1}: ${s.exercises?.length || 0} ejercicios, ${s.metrics?.durationMinutes || 0} min`
          );
        });
      }
    } catch (error) {
      console.error(`\nError: ${error.message}`);
    }

    // Test 2: Con AbortSignal (no abortado)
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('TEST 2: Generación con AbortSignal (sin abortar)');
    console.log('═══════════════════════════════════════════════════════════');

    const abortController2 = new AbortController();
    const start2 = Date.now();

    try {
      const result2 = await planningGenerationService.generateIndividual(
        { ...testInput, profile: { ...testInput.profile, numberOfSessions: 4 } },
        { user: { id: 1 }, requestId: 'test-2' },
        { signal: abortController2.signal }
      );

      const time2 = Date.now() - start2;
      console.log(`\nCompletado en ${time2}ms`);
      console.log(`   ID Plan: ${result2.id}`);
      console.log(`   Sesiones: ${result2.sessions?.length || 0}`);
      console.log(`   wasAborted: ${result2.wasAborted}`);

      if (result2.sessions && result2.sessions.length > 0) {
        result2.sessions.forEach((s, i) => {
          console.log(
            `   Sesión ${i + 1}: ${s.exercises?.length || 0} ejercicios, ${s.metrics?.durationMinutes || 0} min`
          );
        });
      }
    } catch (error) {
      console.error(`\nError: ${error.message}`);
    }

    // Test 3: Con AbortSignal abortado inmediatamente
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('TEST 3: Generación con AbortSignal (abortado antes de empezar)');
    console.log('═══════════════════════════════════════════════════════════');

    const abortController3 = new AbortController();
    abortController3.abort(); // Abortar ANTES de empezar

    const start3 = Date.now();
    try {
      const result3 = await planningGenerationService.generateIndividual(
        testInput,
        { user: { id: 1 }, requestId: 'test-3' },
        { signal: abortController3.signal }
      );

      const time3 = Date.now() - start3;
      console.log(`\nCompletado en ${time3}ms`);
      console.log(`   Resultado: ${JSON.stringify(result3)}`);
    } catch (error) {
      console.error(`\nError: ${error.message}`);
    }

    // Test 4: Con múltiples objetivos y tags
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('TEST 4: Con 2 objetivos y 5 tags');
    console.log('═══════════════════════════════════════════════════════════');

    const testInput4 = {
      profile: {
        playerId: 1,
        intensity: 'medium',
        sessionDurationMinutes: 75,
        numberOfSessions: 3,
        clubId: null,
      },
      goals: ['Mejora del tiro exterior', 'Fundamentos técnicos'],
      constraints: {
        equipment: [],
        tags: ['tiro', 'técnica', 'pase', 'bote', 'calentamiento'],
      },
    };

    const start4 = Date.now();
    try {
      const result4 = await planningGenerationService.generateIndividual(
        testInput4,
        { user: { id: 1 }, requestId: 'test-4' },
        {}
      );

      const time4 = Date.now() - start4;
      console.log(`\nCompletado en ${time4}ms`);
      console.log(`   ID Plan: ${result4.id}`);
      console.log(`   Sesiones: ${result4.sessions?.length || 0}`);
      console.log(`   Ejercicios totales: ${result4.metrics?.exercisesCount || 0}`);

      if (result4.sessions && result4.sessions.length > 0) {
        result4.sessions.forEach((s, i) => {
          const phases = {};
          (s.exercises || []).forEach((e) => {
            phases[e.phase] = (phases[e.phase] || 0) + 1;
          });
          console.log(
            `   Sesión ${i + 1}: ${s.exercises?.length || 0} ejercicios | ${Object.entries(phases)
              .map(([k, v]) => `${k}:${v}`)
              .join(', ')}`
          );
        });
      }
    } catch (error) {
      console.error(`\nError: ${error.message}`);
      console.error(error.stack);
    }

    console.log('\n\nTests de flujo completados');
  } catch (error) {
    console.error('Error general:', error);
    console.error(error.stack);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

testGenerationFlow();
