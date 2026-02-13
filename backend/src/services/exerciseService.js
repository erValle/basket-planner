const { StatusCodes } = require('http-status-codes');
const { Op } = require('sequelize');
const path = require('path');

const { Exercise, Equipment } = require('../../models');
const errorUtils = require('../libs/errorHelper');
const { normalizeMaterialName } = require('./equipmentService');
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

    if (
      parsedDifficulty &&
      typeof parsedDifficulty === 'object' &&
      !Array.isArray(parsedDifficulty)
    ) {
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
          .map((t) => t.trim())
          .filter(Boolean);
    where.tags = { [Op.contains]: parsed };
  }
  return Exercise.findAll({ where });
};

const getExerciseById = async (id) => {
  const ex = await Exercise.findByPk(id, {
    include: [{ model: Equipment, through: { attributes: [] } }],
  });
  if (!ex) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'EXERCISE_NOT_FOUND', 'Exercise not found');
  }
  return ex;
};

const createExercise = async (payload) => {
  // Verificar si el ejercicio tiene todos los materiales necesarios disponibles
  if (payload.clubId && payload.characteristics?.requiredEquipment) {
    const requiredMaterials = payload.characteristics.requiredEquipment;

    if (requiredMaterials.length > 0) {
      // Obtener materiales disponibles del club
      const availableEquipment = await Equipment.findAll({
        where: {
          clubId: payload.clubId,
          status: 'available',
        },
      });

      const availableMaterials = availableEquipment.map((e) => normalizeMaterialName(e.name));

      // Verificar si todos los materiales están disponibles
      const hasAllMaterials = requiredMaterials.every((required) => {
        const normalizedRequired = normalizeMaterialName(required);
        return availableMaterials.some(
          (available) =>
            available === normalizedRequired ||
            available.includes(normalizedRequired) ||
            normalizedRequired.includes(available)
        );
      });

      // Si no tiene todos los materiales, marcar como inactivo
      if (!hasAllMaterials) {
        payload.active = false;
      }
    }
  }

  return Exercise.create(payload);
};

const updateExercise = async (id, payload) => {
  const ex = await Exercise.findByPk(id);
  if (!ex) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'EXERCISE_NOT_FOUND', 'Exercise not found');
  }

  // Si se está actualizando el material requerido, verificar disponibilidad
  if (ex.clubId && payload.characteristics?.requiredEquipment) {
    const requiredMaterials = payload.characteristics.requiredEquipment;

    if (requiredMaterials.length > 0) {
      // Obtener materiales disponibles del club
      const availableEquipment = await Equipment.findAll({
        where: {
          clubId: ex.clubId,
          status: 'available',
        },
      });

      const availableMaterials = availableEquipment.map((e) => normalizeMaterialName(e.name));

      // Verificar si todos los materiales están disponibles
      const hasAllMaterials = requiredMaterials.every((required) => {
        const normalizedRequired = normalizeMaterialName(required);
        return availableMaterials.some(
          (available) =>
            available === normalizedRequired ||
            available.includes(normalizedRequired) ||
            normalizedRequired.includes(available)
        );
      });

      // Si no tiene todos los materiales, marcar como inactivo (a menos que se especifique lo contrario)
      if (!hasAllMaterials && payload.active !== false) {
        payload.active = false;
      } else if (hasAllMaterials && payload.active === undefined) {
        payload.active = true;
      }
    }
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
    active: true,
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
      return dbExercises.map((ex) => {
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
          difficulty:
            typeof exJSON.difficulty === 'string'
              ? JSON.parse(exJSON.difficulty)
              : exJSON.difficulty,
          dificultad:
            typeof exJSON.difficulty === 'string'
              ? JSON.parse(exJSON.difficulty)
              : exJSON.difficulty,
          duration: exJSON.duration,
          duracion_segundos: exJSON.duration,
          tags: tags.tags || [],
          etiquetas: tags.tags || [],
          materials: tags.materiales || [],
          materiales_necesarios: tags.materiales || [],
          active: exJSON.active,
        };
      });
    }

    // Si no hay ejercicios en DB, usar JSON
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
    if (
      parsedDifficulty &&
      typeof parsedDifficulty === 'object' &&
      !Array.isArray(parsedDifficulty)
    ) {
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
          .map((t) => t.trim())
          .filter(Boolean);
    where.tags = { [Op.contains]: parsed };
  }

  if (search) {
    where.name = { [Op.iLike]: `%${search}%` };
  }

  // Consulta paginada
  const { count, rows } = await Exercise.findAndCountAll({
    where,
    include: [{ model: Equipment, as: 'equipmentItems', through: { attributes: [] } }],
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

/**
 * Obtiene las etiquetas más usadas en los ejercicios
 * @returns {Promise<Array<{tag: string, count: number}>>} Lista de etiquetas ordenadas por frecuencia
 */
const getPopularTags = async () => {
  // Obtener todos los ejercicios activos
  const exercises = await Exercise.findAll({
    where: { active: true },
    attributes: ['tags'],
  });

  // Contar frecuencia de cada etiqueta
  const tagCounts = {};

  for (const exercise of exercises) {
    let tags = [];

    // Las tags pueden estar en diferentes formatos:
    // 1. Array directo: ['tag1', 'tag2']
    // 2. Objeto con propiedad tags: { tags: ['tag1', 'tag2'] }
    if (Array.isArray(exercise.tags)) {
      tags = exercise.tags;
    } else if (exercise.tags && typeof exercise.tags === 'object') {
      if (Array.isArray(exercise.tags.tags)) {
        tags = exercise.tags.tags;
      }
    }

    for (const tag of tags) {
      if (tag && typeof tag === 'string') {
        const normalizedTag = tag.toLowerCase().trim();
        if (normalizedTag) {
          tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
        }
      }
    }
  }

  // Convertir a array y ordenar por frecuencia
  const sortedTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  return sortedTags;
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
  getPopularTags,
};
