'use strict';

const path = require('path');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Limpiar ejercicios existentes
    await queryInterface.bulkDelete('exercises', null, {});
    console.log('🗑️  Ejercicios anteriores eliminados');
    
    const exercises = require(path.join(__dirname, '../../db_ejercicios_reducido.json'));
    
    // Mapear ejercicios al formato de la base de datos
    const exercisesToInsert = exercises.map((exercise, index) => ({
      name: exercise.nombre,
      description: exercise.descripcion,
      type: mapTypeToEnum(exercise.tipo),
      difficulty: JSON.stringify(exercise.dificultad),
      duration: exercise.duracion_segundos,
      tags: JSON.stringify({
        tags: exercise.etiquetas,
        tipo_original: exercise.tipo,
        materiales: exercise.materiales_necesarios
      }),
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    await queryInterface.bulkInsert('exercises', exercisesToInsert, {});
    
    console.log(`✅ Insertados ${exercisesToInsert.length} ejercicios (versión reducida)`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('exercises', null, {});
  }
};

/**
 * Mapea los tipos del JSON a los enums de la base de datos
 * Como los tipos originales son muy específicos de baloncesto,
 * los mapeamos a categorías más generales
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
