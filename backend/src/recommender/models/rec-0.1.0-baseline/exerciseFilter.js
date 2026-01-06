/**
 * Filtrador de ejercicios basado en restricciones y disponibilidad
 */

const config = require('./config');

/**
 * Normaliza un nombre de material para comparación
 * @param {string} material - Nombre del material
 * @returns {string} Material normalizado
 */
function normalizeMaterial(material) {
  if (!material) return '';
  const lower = material.toLowerCase().trim();
  
  // Buscar en el mapeo de normalización
  for (const [normalized, variants] of Object.entries(config.materialNormalization)) {
    if (variants.some(v => lower.includes(v.toLowerCase()) || v.toLowerCase().includes(lower))) {
      return normalized;
    }
  }
  
  return lower;
}

/**
 * Verifica si un ejercicio requiere materiales que no están disponibles
 * @param {Array<string>} exerciseMaterials - Materiales necesarios para el ejercicio
 * @param {Array<string>} availableMaterials - Materiales disponibles
 * @returns {boolean} true si todos los materiales están disponibles
 */
function hasMaterialsAvailable(exerciseMaterials, availableMaterials) {
  if (!exerciseMaterials || exerciseMaterials.length === 0) {
    return true; // No requiere materiales específicos
  }
  
  if (!availableMaterials || availableMaterials.length === 0) {
    // Si no se especifican materiales disponibles, asumimos que están disponibles básicos
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
 * Verifica si un ejercicio es apropiado según lesiones del jugador
 * @param {Object} exercise - Ejercicio a evaluar
 * @param {Array<string>} injuries - Lista de lesiones del jugador
 * @returns {boolean} true si el ejercicio es seguro
 */
function isSafeForInjuries(exercise, injuries) {
  if (!injuries || injuries.length === 0) return true;
  
  const exerciseTags = exercise.tags || exercise.etiquetas || [];
  const exerciseType = exercise.type || exercise.tipo || '';
  
  // Mapeo simple de lesiones a etiquetas/tipos a evitar
  const injuryRestrictions = {
    'ankle': ['salto', 'pliometria', 'agilidad'],
    'tobillo': ['salto', 'pliometria', 'agilidad'],
    'knee': ['salto', 'pliometria', 'pivotes'],
    'rodilla': ['salto', 'pliometria', 'pivotes'],
    'shoulder': ['tiro', 'pase_largo'],
    'hombro': ['tiro', 'pase_largo'],
    'back': ['contacto', 'fisico'],
    'espalda': ['contacto', 'fisico']
  };
  
  for (const injury of injuries) {
    const injuryLower = injury.toLowerCase();
    for (const [injuryKey, restrictedTags] of Object.entries(injuryRestrictions)) {
      if (injuryLower.includes(injuryKey)) {
        // Verificar si el ejercicio contiene etiquetas restringidas
        const hasRestricted = restrictedTags.some(tag => 
          exerciseTags.some(et => et.toLowerCase().includes(tag.toLowerCase())) ||
          exerciseType.toLowerCase().includes(tag.toLowerCase())
        );
        if (hasRestricted) return false;
      }
    }
  }
  
  return true;
}

/**
 * Filtra ejercicios según restricciones
 * @param {Array<Object>} exercises - Lista de ejercicios disponibles
 * @param {Object} constraints - Restricciones
 * @param {Array<string>} constraints.equipment - Materiales disponibles
 * @param {Array<string>} constraints.injuries - Lesiones a considerar
 * @returns {Array<Object>} Ejercicios filtrados
 */
function filterExercises(exercises, constraints = {}) {
  if (!exercises || exercises.length === 0) return [];
  
  const { equipment = [], injuries = [] } = constraints;
  
  return exercises.filter(exercise => {
    // Verificar materiales
    const materials = exercise.materiales_necesarios || exercise.materials || [];
    if (!hasMaterialsAvailable(materials, equipment)) {
      return false;
    }
    
    // Verificar lesiones
    if (!isSafeForInjuries(exercise, injuries)) {
      return false;
    }
    
    // Verificar que esté activo (si tiene ese campo)
    if (exercise.active !== undefined && !exercise.active) {
      return false;
    }
    
    return true;
  });
}

/**
 * Filtra ejercicios por fase de sesión
 * @param {Array<Object>} exercises - Lista de ejercicios
 * @param {string} phase - Fase de la sesión (warmup, technical, tactical, conditioning, recovery)
 * @returns {Array<Object>} Ejercicios apropiados para la fase
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
  isSafeForInjuries,
  filterExercises,
  filterBySessionPhase
};
