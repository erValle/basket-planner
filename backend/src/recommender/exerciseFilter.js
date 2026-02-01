/**
 * Filtrador de ejercicios basado en restricciones y disponibilidad
 */

const config = require('./config');

/**
 * Normaliza un nombre de material para comparación
 */
function normalizeMaterial(material) {
  if (!material) return '';
  
  let normalized = material.toLowerCase().trim();
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  for (const [standardName, variants] of Object.entries(config.materialNormalization)) {
    const normalizedVariants = variants.map(v => 
      v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    );
    
    if (normalizedVariants.includes(normalized) || 
        normalizedVariants.some(v => normalized.includes(v) || v.includes(normalized))) {
      return standardName;
    }
  }
  
  return normalized;
}

/**
 * Verifica si un ejercicio requiere materiales que no están disponibles
 */
function hasMaterialsAvailable(exerciseMaterials, availableMaterials) {
  if (!exerciseMaterials || exerciseMaterials.length === 0) {
    return true;
  }
  
  if (!availableMaterials || availableMaterials.length === 0) {
    const basicMaterials = ['balon', 'canasta', 'conos'];
    availableMaterials = basicMaterials;
  }
  
  const normalizedAvailable = availableMaterials.map(normalizeMaterial);
  
  return exerciseMaterials.every(material => {
    const normalized = normalizeMaterial(material);
    return normalizedAvailable.includes(normalized);
  });
}

/**
 * Filtra ejercicios según restricciones
 */
function filterExercises(exercises, constraints = {}) {
  if (!exercises || exercises.length === 0) return [];
  
  const { equipment = [] } = constraints;
  
  return exercises.filter(exercise => {
    const materials = exercise.materiales_necesarios || exercise.materials || [];
    if (!hasMaterialsAvailable(materials, equipment)) {
      return false;
    }
    
    if (exercise.active !== undefined && !exercise.active) {
      return false;
    }
    
    return true;
  });
}

/**
 * Filtra ejercicios por fase de sesión
 */
function filterBySessionPhase(exercises, phase) {
  const allowedTypes = config.sessionPhaseTypes[phase] || [];
  if (allowedTypes.length === 0) return exercises;
  
  return exercises.filter(exercise => {
    const type = exercise.type || exercise.tipo;
    return allowedTypes.includes(type);
  });
}

module.exports = {
  normalizeMaterial,
  hasMaterialsAvailable,
  filterExercises,
  filterBySessionPhase
};
