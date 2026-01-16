#!/usr/bin/env node
/**
 * Script para insertar ejercicios de baloncesto en la base de datos
 * 
 * Uso:
 *   node scripts/seed-exercises.js [--file=db_ejercicios_reducido.json] [--clear]
 * 
 * Opciones:
 *   --file     Archivo JSON con los ejercicios (por defecto: db_ejercicios_reducido.json)
 *   --clear    Elimina todos los ejercicios existentes antes de insertar
 *   --help     Muestra esta ayuda
 */

require('dotenv').config();
const path = require('path');
const { Exercise } = require('../models');

/**
 * Mapea los tipos del JSON a los enums de la base de datos
 */
function mapTypeToEnum(tipo) {
  const mapping = {
    'TECNICA_BOTE': 'strength',
    'FINALIZACION_ARO': 'strength',
    'TIRO': 'strength',
    'PASE': 'strength',
    'TACTICA_ATAQUE': 'balance',
    'TACTICA_ATAQUE_DEFENSA': 'balance',
    'DEFENSA_EQUIPO': 'balance',
    'DEFENSA_INDIVIDUAL': 'strength',
    'DEFENSA_FUNDAMENTOS': 'strength',
    'REBOTE': 'strength',
    'TECNICA_POSTE': 'strength',
    'ATAQUE_INDIVIDUAL': 'strength',
    'TECNICA_PIES': 'balance',
    'CONDICIONAMIENTO_FISICO': 'cardio',
    'MOVILIDAD_RECUPERACION': 'flexibility',
    'TACTICA_TRANSICION': 'cardio',
    'ABP_SAQUES': 'balance',
    'JUEGO_REDUCIDO': 'cardio'
  };
  
  return mapping[tipo] || 'balance';
}

async function seedExercises() {
  try {
    console.log('🏀 Iniciando inserción de ejercicios de baloncesto...\n');

    // Parsear argumentos
    const args = process.argv.slice(2);
    if (args.includes('--help')) {
      console.log(`
Uso:
  node scripts/seed-exercises.js [--file=db_ejercicios_reducido.json] [--clear]

Opciones:
  --file     Archivo JSON con los ejercicios (por defecto: db_ejercicios_reducido.json)
  --clear    Elimina todos los ejercicios existentes antes de insertar
  --help     Muestra esta ayuda

Archivos disponibles:
  - db_ejercicios_reducido.json (29 ejercicios - recomendado)
  - db_ejercicios.json (102 ejercicios - completo)
      `);
      process.exit(0);
    }

    const clearFlag = args.includes('--clear');
    let fileName = 'db_ejercicios_reducido.json';
    
    const fileArg = args.find(arg => arg.startsWith('--file='));
    if (fileArg) {
      fileName = fileArg.split('=')[1];
    }

    const filePath = path.join(__dirname, '../../', fileName);
    console.log(`📁 Cargando ejercicios desde: ${fileName}`);

    let exercises;
    try {
      exercises = require(filePath);
    } catch (error) {
      console.error(`❌ Error: No se pudo cargar el archivo "${fileName}"`);
      console.error(`   Ruta intentada: ${filePath}`);
      console.error(`   ${error.message}`);
      process.exit(1);
    }

    if (!Array.isArray(exercises) || exercises.length === 0) {
      console.error('❌ Error: El archivo no contiene un array válido de ejercicios');
      process.exit(1);
    }

    console.log(`ℹ️  Ejercicios a insertar: ${exercises.length}\n`);

    // Limpiar ejercicios existentes si se especificó --clear
    if (clearFlag) {
      const count = await Exercise.count();
      if (count > 0) {
        console.log(`🗑️  Eliminando ${count} ejercicios existentes...`);
        await Exercise.destroy({ where: {}, truncate: true });
        console.log('✅ Ejercicios eliminados\n');
      }
    }

    // Insertar ejercicios
    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const exercise of exercises) {
      try {
        // Verificar si ya existe (por nombre)
        const existing = await Exercise.findOne({
          where: { name: exercise.nombre }
        });

        if (existing) {
          console.log(`⏭️  Saltando "${exercise.nombre}" (ya existe)`);
          skipped++;
          continue;
        }

        // Insertar ejercicio
        await Exercise.create({
          name: exercise.nombre,
          description: exercise.descripcion,
          type: mapTypeToEnum(exercise.tipo),
          difficulty: exercise.dificultad,
          duration: exercise.duracion_segundos,
          tags: {
            tags: exercise.etiquetas,
            tipo_original: exercise.tipo,
            materiales: exercise.materiales_necesarios
          },
          active: true
        });

        console.log(`✅ Insertado: ${exercise.nombre}`);
        inserted++;
      } catch (error) {
        console.error(`❌ Error insertando "${exercise.nombre}": ${error.message}`);
        errors++;
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   ✅ Insertados: ${inserted}`);
    console.log(`   ⏭️  Saltados: ${skipped}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   📦 Total: ${exercises.length}`);
    console.log('\n✨ Proceso completado!\n');

    process.exit(errors > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Error al insertar ejercicios:', error);
    process.exit(1);
  }
}

// Ejecutar
seedExercises();
