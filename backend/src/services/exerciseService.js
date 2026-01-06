const { StatusCodes } = require('http-status-codes');
const { Op } = require('sequelize');
const path = require('path');

const { Exercise, Equipment } = require('../../models');
const errorUtils = require('../libs/errorHelper');
// El archivo está en el root del proyecto, no en backend
const exercisesJSON = require(path.join(__dirname, '../../../db_ejercicios.json'));

const listExercises = async ({ type, difficulty, tags } = {}) => {
  const where = {};
  if (type) where.type = type;
  if (difficulty) {
    // difficulty is JSONB; allow filtering by providing either:
    // - an object (will match rows that contain that object)
    // - a JSON string (we'll parse it)
    // - a plain string (fallback exact match, but mainly for backward compat)
    let parsedDifficulty = difficulty;
    if (typeof difficulty === 'string') {
      try {
        parsedDifficulty = JSON.parse(difficulty);
      } catch (_) {
        parsedDifficulty = difficulty;
      }
    }

    if (parsedDifficulty && typeof parsedDifficulty === 'object' && !Array.isArray(parsedDifficulty)) {
      where.difficulty = { [Op.contains]: parsedDifficulty };
    } else {
      where.difficulty = parsedDifficulty;
    }
  }
  if (tags) {
    const parsed = Array.isArray(tags)
      ? tags
      : String(tags)
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);
    where.tags = { [Op.contains]: parsed };
  }
  return Exercise.findAll({ where });
};

const getExerciseById = async (id) => {
  const ex = await Exercise.findByPk(id, {
    include: [{ model: Equipment, through: { attributes: ['quantity'] } }],
  });
  if (!ex) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'EXERCISE_NOT_FOUND', 'Exercise not found');
  }
  return ex;
};

const createExercise = async (payload) => Exercise.create(payload);

const updateExercise = async (id, payload) => {
  const ex = await Exercise.findByPk(id);
  if (!ex) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'EXERCISE_NOT_FOUND', 'Exercise not found');
  }
  await ex.update(payload);
  return ex;
};

const deleteExercise = async (id) => {
  const ex = await Exercise.findByPk(id);
  if (!ex) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'EXERCISE_NOT_FOUND', 'Exercise not found');
  }
  await ex.destroy();
};

/**
 * Obtiene todos los ejercicios desde el JSON (para usar antes del seeding o como fallback)
 * @returns {Array<Object>} Lista de ejercicios con formato normalizado
 */
const getAllExercisesFromJSON = () => {
  return exercisesJSON.map((exercise, index) => ({
    id: `json-${index}`,
    name: exercise.nombre,
    nombre: exercise.nombre,
    description: exercise.descripcion,
    descripcion: exercise.descripcion,
    type: exercise.tipo,
    tipo: exercise.tipo,
    difficulty: exercise.dificultad,
    dificultad: exercise.dificultad,
    duration: exercise.duracion_segundos,
    duracion_segundos: exercise.duracion_segundos,
    tags: exercise.etiquetas,
    etiquetas: exercise.etiquetas,
    materials: exercise.materiales_necesarios,
    materiales_necesarios: exercise.materiales_necesarios,
    active: true
  }));
};

/**
 * Obtiene todos los ejercicios (intenta desde DB, si falla o está vacío usa JSON)
 * Normaliza el formato para que sea compatible con el modelo de recomendación
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Array<Object>>} Lista de ejercicios
 */
const getAllExercisesForRecommender = async (filters = {}) => {
  try {
    const where = {};
    if (filters.active !== undefined) {
      where.active = filters.active;
    }
    
    const dbExercises = await Exercise.findAll({ where, order: [['name', 'ASC']] });
    
    // Si hay ejercicios en la DB, usarlos
    if (dbExercises.length > 0) {
      return dbExercises.map(ex => {
        const exJSON = ex.toJSON();
        const tags = exJSON.tags || {};
        return {
          id: exJSON.id,
          name: exJSON.name,
          nombre: exJSON.name,
          description: exJSON.description,
          descripcion: exJSON.description,
          type: tags.tipo_original || exJSON.type,
          tipo: tags.tipo_original || exJSON.type,
          difficulty: typeof exJSON.difficulty === 'string' ? JSON.parse(exJSON.difficulty) : exJSON.difficulty,
          dificultad: typeof exJSON.difficulty === 'string' ? JSON.parse(exJSON.difficulty) : exJSON.difficulty,
          duration: exJSON.duration,
          duracion_segundos: exJSON.duration,
          tags: tags.tags || [],
          etiquetas: tags.tags || [],
          materials: tags.materiales || [],
          materiales_necesarios: tags.materiales || [],
          active: exJSON.active
        };
      });
    }
    
    // Si no hay ejercicios en DB, usar JSON
    console.log('⚠️  No se encontraron ejercicios en la BD, usando datos del JSON');
    return getAllExercisesFromJSON();
  } catch (error) {
    console.warn('Error al obtener ejercicios de la BD, usando JSON:', error.message);
    return getAllExercisesFromJSON();
  }
};

/**
 * Lista ejercicios con paginación
 * @param {Object} query - Query parameters { page, pageSize, type, difficulty, tags }
 * @returns {Promise<Object>} { exercises: Array, pagination: Object }
 */
const listExercisesPaginated = async (query = {}) => {
  const { page = 1, pageSize = 12, type, difficulty, tags, search } = query;
  
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const limit = parseInt(pageSize);
  
  // Construir filtros
  const where = {};
  
  if (type) {
    where.type = type;
  }
  
  if (difficulty) {
    let parsedDifficulty = difficulty;
    if (typeof difficulty === 'string') {
      try {
        parsedDifficulty = JSON.parse(difficulty);
      } catch (_) {
        parsedDifficulty = difficulty;
      }
    }
    if (parsedDifficulty && typeof parsedDifficulty === 'object' && !Array.isArray(parsedDifficulty)) {
      where.difficulty = { [Op.contains]: parsedDifficulty };
    } else {
      where.difficulty = parsedDifficulty;
    }
  }
  
  if (tags) {
    const parsed = Array.isArray(tags)
      ? tags
      : String(tags).split(',').map(t => t.trim()).filter(Boolean);
    where.tags = { [Op.contains]: parsed };
  }
  
  if (search) {
    where.name = { [Op.iLike]: `%${search}%` };
  }
  
  // Consulta paginada
  const { count, rows } = await Exercise.findAndCountAll({
    where,
    include: [{ model: Equipment, as: 'equipmentItems', through: { attributes: ['quantity'] } }],
    limit,
    offset,
    order: [['name', 'ASC']],
  });
  
  const totalPages = Math.ceil(count / limit);
  
  return {
    exercises: rows,
    pagination: {
      page: parseInt(page),
      pageSize: limit,
      total: count,
      totalPages,
      hasNextPage: parseInt(page) < totalPages,
      hasPreviousPage: parseInt(page) > 1,
    },
  };
};

module.exports = {
  listExercises,
  listExercisesPaginated,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
  getAllExercisesFromJSON,
  getAllExercisesForRecommender,
};
