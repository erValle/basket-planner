#!/usr/bin/env node
/**
 * Script para asociar materiales a ejercicios de forma inteligente
 * 
 * Lee el campo tags/materiales_necesarios de los ejercicios y crea asociaciones
 * automáticas con la tabla equipment basado en keywords.
 * 
 * Uso:
 *   node backend/scripts/associateEquipmentToExercises.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { Exercise, Equipment, ExerciseEquipment } = require('../models');

/**
 * Mapeo inteligente de keywords a nombres de equipment
 * Cada key es un término que puede aparecer en materiales_necesarios
 * Cada value es un array de keywords que matchean con equipment.name
 */
const equipmentMapping = {
  // Balones
  'balon': ['balón', 'balon', 'ball', 'pelota'],
  '2_balones': ['2 balones', 'dos balones', '2_balones'],
  
  // Obstáculos y marcadores
  'conos': ['cono', 'conos', 'cone', 'marker'],
  'escalera': ['escalera', 'ladder', 'agilidad', 'agility'],
  'aro': ['aro', 'hoop', 'ring'],
  
  // Canasta
  'canasta': ['canasta', 'basket', 'aro', 'tablero'],
  
  // Resistencia y acondicionamiento
  'banda_elastica': ['banda', 'elastica', 'resistance', 'band'],
  'pesas': ['pesa', 'mancuerna', 'dumbbell', 'weight'],
  'cajon_pliometria': ['cajon', 'pliometria', 'box', 'plyo'],
  
  // Recuperación
  'foam_pad': ['foam', 'pad', 'colchoneta', 'mat'],
  'foam_roller': ['foam roller', 'roller', 'rodillo'],
  
  // Identificación
  'petos': ['peto', 'petos', 'chaleco', 'vest', 'bib'],
  'tarjetas_colores': ['tarjeta', 'color', 'card'],
  
  // Entrenamiento
  'pizarra_tactica': ['pizarra', 'tactica', 'whiteboard', 'board'],
  'rebotador_o_companero': ['rebotador', 'compañero', 'partner', 'rebounder'],
  
  // Cronometraje
  'cronometro_o_app': ['cronometro', 'timer', 'reloj', 'clock'],
  'silbato_o_app_senal': ['silbato', 'whistle', 'señal', 'signal'],
};

/**
 * Busca equipment que matchee con un material
 * @param {string} material - Material del ejercicio
 * @param {Array} allEquipment - Todos los equipment disponibles
 * @returns {Object|null} Equipment que matchea o null
 */
function findMatchingEquipment(material, allEquipment) {
  const materialLower = material.toLowerCase().trim();
  
  // Buscar en el mapeo
  for (const [equipName, keywords] of Object.entries(equipmentMapping)) {
    const matches = keywords.some(kw => 
      materialLower.includes(kw.toLowerCase()) || 
      kw.toLowerCase().includes(materialLower)
    );
    
    if (matches) {
      // Buscar equipment cuyo nombre matchee con equipName o keywords
      const equipment = allEquipment.find(e => {
        const eName = e.name.toLowerCase();
        return keywords.some(kw => 
          eName.includes(kw.toLowerCase()) || 
          kw.toLowerCase().includes(eName)
        );
      });
      
      if (equipment) {
        return equipment;
      }
    }
  }
  
  // Búsqueda directa por nombre similar
  return allEquipment.find(e => {
    const eName = e.name.toLowerCase();
    return eName.includes(materialLower) || materialLower.includes(eName);
  });
}

/**
 * Determina cantidad apropiada según el tipo de material
 * @param {string} materialName - Nombre del material
 * @returns {number} Cantidad recomendada
 */
function getRecommendedQuantity(materialName) {
  const name = materialName.toLowerCase();
  
  if (name.includes('2_balon') || name.includes('dos balon')) return 2;
  if (name.includes('cono')) return 6;
  if (name.includes('peto')) return 10;
  if (name.includes('banda')) return 1;
  
  return 1; // Default
}

async function associateEquipment() {
  try {
    console.log('🔄 Iniciando asociación de materiales a ejercicios...\n');
    
    // Cargar todos los ejercicios con sus asociaciones actuales
    const exercises = await Exercise.findAll({
      include: [{ 
        model: Equipment, 
        as: 'equipmentItems',
        through: { attributes: ['quantity'] }
      }],
      order: [['type', 'ASC'], ['name', 'ASC']]
    });
    
    if (exercises.length === 0) {
      console.log('⚠️  No se encontraron ejercicios en la base de datos');
      return;
    }
    
    // Cargar todos los equipment disponibles
    const allEquipment = await Equipment.findAll();
    
    if (allEquipment.length === 0) {
      console.log('⚠️  No hay equipment en la base de datos. Ejecuta el seeder primero.');
      return;
    }
    
    console.log(`📊 ${exercises.length} ejercicios encontrados`);
    console.log(`🎯 ${allEquipment.length} tipos de equipment disponibles\n`);
    
    let associatedCount = 0;
    let skippedCount = 0;
    let newAssociationsCount = 0;
    const stats = {
      byEquipment: {},
      unmatchedMaterials: new Set()
    };
    
    for (const exercise of exercises) {
      // Si ya tiene asociaciones, skip (no sobrescribir asociaciones manuales)
      if (exercise.equipmentItems && exercise.equipmentItems.length > 0) {
        skippedCount++;
        console.log(`➖ ${exercise.name} - Ya tiene ${exercise.equipmentItems.length} materiales asociados`);
        continue;
      }
      
      // Extraer materiales del campo tags
      const tags = exercise.tags || {};
      const materials = tags.materiales_necesarios || tags.materiales || [];
      
      if (!Array.isArray(materials) || materials.length === 0) {
        console.log(`⚠️  ${exercise.name} - No tiene materiales definidos`);
        continue;
      }
      
      const equipmentIds = [];
      const matchedEquipment = [];
      
      // Buscar equipment para cada material
      for (const material of materials) {
        const equipment = findMatchingEquipment(material, allEquipment);
        
        if (equipment && !equipmentIds.includes(equipment.id)) {
          equipmentIds.push(equipment.id);
          matchedEquipment.push({
            equipment,
            quantity: getRecommendedQuantity(material)
          });
          
          // Estadísticas
          stats.byEquipment[equipment.name] = (stats.byEquipment[equipment.name] || 0) + 1;
        } else if (!equipment) {
          stats.unmatchedMaterials.add(material);
        }
      }
      
      // Crear asociaciones
      if (matchedEquipment.length > 0) {
        const associations = await Promise.all(
          matchedEquipment.map(({ equipment, quantity }) =>
            ExerciseEquipment.create({
              exerciseId: exercise.id,
              equipmentId: equipment.id,
              quantity: quantity
            })
          )
        );
        
        associatedCount++;
        newAssociationsCount += associations.length;
        
        console.log(`✅ ${exercise.name}`);
        console.log(`   Materiales: ${matchedEquipment.map(m => `${m.equipment.name} (x${m.quantity})`).join(', ')}`);
      } else {
        console.log(`⚠️  ${exercise.name} - No se encontraron matches para: ${materials.join(', ')}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 RESUMEN DE ASOCIACIÓN');
    console.log('='.repeat(60));
    console.log(`Total de ejercicios: ${exercises.length}`);
    console.log(`✅ Ejercicios con nuevas asociaciones: ${associatedCount}`);
    console.log(`➖ Ejercicios saltados (ya tenían asociaciones): ${skippedCount}`);
    console.log(`🔗 Total de asociaciones creadas: ${newAssociationsCount}`);
    
    if (Object.keys(stats.byEquipment).length > 0) {
      console.log('\n📊 Equipment más usado:');
      const sorted = Object.entries(stats.byEquipment)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      sorted.forEach(([name, count]) => {
        console.log(`   ${name}: ${count} ejercicios`);
      });
    }
    
    if (stats.unmatchedMaterials.size > 0) {
      console.log('\n⚠️  Materiales sin match (considera añadirlos a equipment):');
      Array.from(stats.unmatchedMaterials).forEach(material => {
        console.log(`   - ${material}`);
      });
    }
    
    console.log('\n✅ Asociación completada exitosamente\n');
    
  } catch (error) {
    console.error('❌ Error al asociar materiales:', error);
    throw error;
  }
}

// Ejecutar
if (require.main === module) {
  associateEquipment()
    .then(() => {
      console.log('🎉 Script finalizado');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { associateEquipment, findMatchingEquipment };
