#!/usr/bin/env node
/**
 * Script para actualizar las duraciones de los ejercicios a valores más realistas
 *
 * Actualmente los ejercicios tienen duraciones muy cortas (75-180 segundos).
 * Este script los ajusta a rangos más apropiados para entrenamientos de basketball (5-25 minutos).
 *
 * Uso:
 *   node backend/scripts/updateExerciseDurations.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { Exercise } = require('../models');

// Mapeo de tipos de ejercicio a rangos de duración recomendados (en minutos)
const durationRangesByType = {
  TECNICA_BOTE: { min: 8, max: 12, multiplier: 3 },
  FINALIZACION_ARO: { min: 10, max: 15, multiplier: 3 },
  TIRO: { min: 12, max: 18, multiplier: 4 },
  PASE: { min: 8, max: 12, multiplier: 3 },
  TACTICA_ATAQUE: { min: 15, max: 20, multiplier: 5 },
  TACTICA_ATAQUE_DEFENSA: { min: 15, max: 25, multiplier: 5 },
  DEFENSA_EQUIPO: { min: 12, max: 18, multiplier: 4 },
  DEFENSA_INDIVIDUAL: { min: 10, max: 15, multiplier: 3.5 },
  DEFENSA_FUNDAMENTOS: { min: 8, max: 12, multiplier: 3 },
  REBOTE: { min: 8, max: 12, multiplier: 3 },
  TECNICA_POSTE: { min: 10, max: 15, multiplier: 3.5 },
  ATAQUE_INDIVIDUAL: { min: 10, max: 15, multiplier: 3.5 },
  TECNICA_PIES: { min: 8, max: 12, multiplier: 3 },
  CONDICIONAMIENTO_FISICO: { min: 15, max: 25, multiplier: 5 },
  MOVILIDAD_RECUPERACION: { min: 10, max: 15, multiplier: 3.5 },
  TACTICA_TRANSICION: { min: 12, max: 18, multiplier: 4 },
  ABP_SAQUES: { min: 10, max: 15, multiplier: 3.5 },
  JUEGO_REDUCIDO: { min: 15, max: 20, multiplier: 4.5 },
  default: { min: 10, max: 15, multiplier: 3.5 },
};

/**
 * Calcula nueva duración basada en el tipo de ejercicio
 * @param {number} currentDuration - Duración actual en minutos
 * @param {string} type - Tipo de ejercicio
 * @returns {number} Nueva duración en minutos
 */
function calculateNewDuration(currentDuration, type) {
  const config = durationRangesByType[type] || durationRangesByType.default;

  // Si la duración actual está en segundos (muy pequeña), convertir primero
  let durationInMinutes = currentDuration;
  if (currentDuration < 5) {
    // Probablemente está en segundos, convertir a minutos
    durationInMinutes = Math.ceil(currentDuration / 60);
  }

  // Aplicar multiplicador
  let newDuration = Math.ceil(durationInMinutes * config.multiplier);

  // Asegurar que esté dentro del rango recomendado
  newDuration = Math.max(config.min, Math.min(config.max, newDuration));

  return newDuration;
}

async function updateDurations() {
  try {
    console.log('Iniciando actualización de duraciones de ejercicios...\n');

    const exercises = await Exercise.findAll({
      order: [
        ['type', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    if (exercises.length === 0) {
      console.log(' No se encontraron ejercicios en la base de datos');
      return;
    }

    console.log(`Se encontraron ${exercises.length} ejercicios\n`);

    let updatedCount = 0;
    let unchangedCount = 0;
    const updates = [];

    for (const exercise of exercises) {
      const currentDuration = exercise.duration;
      const newDuration = calculateNewDuration(currentDuration, exercise.type);

      if (currentDuration !== newDuration) {
        updates.push({
          id: exercise.id,
          name: exercise.name,
          type: exercise.type,
          oldDuration: currentDuration,
          newDuration: newDuration,
        });

        await exercise.update({ duration: newDuration });
        updatedCount++;

        console.log(`${exercise.name}`);
        console.log(`   Tipo: ${exercise.type}`);
        console.log(`   ${currentDuration} min → ${newDuration} min`);
        console.log('');
      } else {
        unchangedCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('RESUMEN DE ACTUALIZACIÓN');
    console.log('='.repeat(60));
    console.log(`Total de ejercicios: ${exercises.length}`);
    console.log(`Actualizados: ${updatedCount}`);
    console.log(`➖ Sin cambios: ${unchangedCount}`);

    if (updates.length > 0) {
      console.log('\n📋 Cambios realizados:');

      // Agrupar por tipo
      const byType = {};
      updates.forEach((u) => {
        if (!byType[u.type]) byType[u.type] = [];
        byType[u.type].push(u);
      });

      Object.entries(byType).forEach(([type, items]) => {
        console.log(`\n  ${type} (${items.length} ejercicios):`);
        const avgOld = items.reduce((sum, i) => sum + i.oldDuration, 0) / items.length;
        const avgNew = items.reduce((sum, i) => sum + i.newDuration, 0) / items.length;
        console.log(`    Duración promedio: ${avgOld.toFixed(1)} min → ${avgNew.toFixed(1)} min`);
      });
    }

    console.log('\nActualización completada exitosamente\n');
  } catch (error) {
    console.error('Error al actualizar duraciones:', error);
    throw error;
  }
}

// Ejecutar
if (require.main === module) {
  updateDurations()
    .then(() => {
      console.log('Script finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { updateDurations, calculateNewDuration };
