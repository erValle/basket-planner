const { StatusCodes } = require('http-status-codes');
const { httpError } = require('../libs/errorHelper');
const { getActiveModel } = require('../recommender/modelManager');
const { getAllExercisesForRecommender } = require('./exerciseService');

const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const intensityMultiplier = {
  low: 0.8,
  medium: 1.0,
  high: 1.2
};

const baseLoadByType = {
  warmup: 1,
  skills: 3,
  conditioning: 4,
  strength: 5,
  tactical: 3,
  recovery: 1
};

const assertUtcDateString = (value, fieldName) => {
  if (!value) return;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw httpError(StatusCodes.BAD_REQUEST, 'INVALID_DATE', `${fieldName} must be a valid date`);
  }
};

const buildExercise = ({ id, name, type, minutes, intensity }) => {
  const load = Math.round(minutes * (baseLoadByType[type] || 3) * intensityMultiplier[intensity]);
  return {
    id,
    name,
    type,
    durationMinutes: minutes,
    intensity,
    estimatedLoad: load
  };
};

const buildSession = ({ sessionIndex, day, durationMinutes, intensity, focusTags }) => {
  const warmup = buildExercise({
    id: `wu-${sessionIndex}`,
    name: 'Dynamic warm-up',
    type: 'warmup',
    minutes: Math.max(10, Math.round(durationMinutes * 0.15)),
    intensity: 'low'
  });

  const mainMinutes = Math.max(20, Math.round(durationMinutes * 0.6));
  const conditioningMinutes = Math.max(10, durationMinutes - warmup.durationMinutes - mainMinutes);

  const skills = buildExercise({
    id: `sk-${sessionIndex}`,
    name: focusTags.includes('shooting') ? 'Shooting series' : 'Ball-handling & passing',
    type: 'skills',
    minutes: Math.round(mainMinutes * 0.6),
    intensity
  });

  const tactical = buildExercise({
    id: `ta-${sessionIndex}`,
    name: focusTags.includes('tactics') ? 'Half-court tactical sets' : 'Small-sided games',
    type: 'tactical',
    minutes: Math.round(mainMinutes * 0.4),
    intensity
  });

  const conditioning = buildExercise({
    id: `co-${sessionIndex}`,
    name: intensity === 'high' ? 'High-intensity intervals' : 'Aerobic conditioning',
    type: 'conditioning',
    minutes: conditioningMinutes,
    intensity
  });

  const exercises = [warmup, skills, tactical, conditioning];
  const totalDurationMinutes = exercises.reduce((sum, e) => sum + e.durationMinutes, 0);
  const estimatedLoad = exercises.reduce((sum, e) => sum + e.estimatedLoad, 0);

  return {
    sessionId: `session-${sessionIndex}`,
    day,
    focusTags,
    exercises,
    metrics: {
      durationMinutes: totalDurationMinutes,
      estimatedLoad
    }
  };
};

const computePlanMetrics = (sessions) => {
  const durationTotalMinutes = sessions.reduce((sum, s) => sum + s.metrics.durationMinutes, 0);
  const estimatedLoadTotal = sessions.reduce((sum, s) => sum + s.metrics.estimatedLoad, 0);
  return {
    durationTotalMinutes,
    estimatedLoadTotal,
    sessionsCount: sessions.length
  };
};

const validateIndividualInput = (input) => {
  if (!input || typeof input !== 'object') {
    throw httpError(StatusCodes.BAD_REQUEST, 'INVALID_INPUT', 'Input must be an object');
  }

  if (!input.profile || typeof input.profile !== 'object') {
    throw httpError(StatusCodes.BAD_REQUEST, 'INVALID_PROFILE', 'profile is required');
  }

  if (!input.profile.athleteId) {
    throw httpError(StatusCodes.BAD_REQUEST, 'INVALID_PROFILE', 'profile.athleteId is required');
  }

  assertUtcDateString(input.startDate, 'startDate');
  assertUtcDateString(input.endDate, 'endDate');
};

const validateGroupInput = (input) => {
  if (!input || typeof input !== 'object') {
    throw httpError(StatusCodes.BAD_REQUEST, 'INVALID_INPUT', 'Input must be an object');
  }

  if (!input.group || typeof input.group !== 'object') {
    throw httpError(StatusCodes.BAD_REQUEST, 'INVALID_GROUP', 'group is required');
  }

  if (!Array.isArray(input.profiles) || input.profiles.length < 2) {
    throw httpError(StatusCodes.BAD_REQUEST, 'INVALID_PROFILES', 'profiles must have at least 2 athletes');
  }

  assertUtcDateString(input.startDate, 'startDate');
  assertUtcDateString(input.endDate, 'endDate');
};

const normalizeDays = (days) => {
  const unique = Array.from(new Set(days || [])).filter(d => dayOrder.includes(d));
  if (unique.length === 0) return ['mon', 'wed', 'fri'];
  return unique.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
};

const deriveFocusTags = (goals) => {
  const g = (goals || []).map(x => String(x).toLowerCase());
  const tags = [];
  if (g.some(x => x.includes('shoot'))) tags.push('shooting');
  if (g.some(x => x.includes('tactic') || x.includes('play'))) tags.push('tactics');
  if (g.some(x => x.includes('strength'))) tags.push('strength');
  if (g.some(x => x.includes('speed') || x.includes('conditioning'))) tags.push('conditioning');
  return tags.length ? tags : ['fundamentals'];
};

/**
 * Deriva el nivel promedio de un grupo de perfiles
 * @param {Array<Object>} profiles - Perfiles de jugadores
 * @returns {string} Nivel promedio
 */
const deriveAverageLevel = (profiles) => {
  if (!profiles || profiles.length === 0) return 'intermediate';
  
  const levelValues = {
    beginner: 1,
    intermediate: 2,
    advanced: 3
  };
  
  const reverseMap = {
    1: 'beginner',
    2: 'intermediate',
    3: 'advanced'
  };
  
  const sum = profiles.reduce((acc, p) => {
    const level = p.level || 'intermediate';
    return acc + (levelValues[level] || 2);
  }, 0);
  
  const avg = Math.round(sum / profiles.length);
  return reverseMap[avg] || 'intermediate';
};

const generateIndividual = async (input) => {
  validateIndividualInput(input);

  const profile = input.profile;
  const intensity = profile.intensity || 'medium';
  const maxSessionsPerWeek = profile.maxSessionsPerWeek || 4;
  const sessionDurationMinutes = profile.sessionDurationMinutes || 75;
  const days = normalizeDays(input.constraints && input.constraints.days);
  
  // Obtener ejercicios disponibles
  const allExercises = await getAllExercisesForRecommender({ active: true });
  
  // Obtener el modelo de recomendación activo
  const recommender = getActiveModel();
  
  // Preparar parámetros para el modelo
  const planParams = {
    goals: input.goals || [],
    constraints: {
      equipment: (input.constraints && input.constraints.equipment) || [],
      injuries: (input.constraints && input.constraints.injuries) || []
    },
    profile: {
      level: profile.level || 'intermediate',
      intensity,
      sessionDurationMinutes,
      maxDurationMinutes: profile.maxDurationMinutes || null
    },
    numberOfSessions: Math.min(maxSessionsPerWeek, days.length),
    days
  };
  
  // Generar planificación usando el modelo de recomendación
  const generatedPlan = recommender.generatePlan(allExercises, planParams);
  
  // Formatear respuesta para mantener compatibilidad con el formato esperado
  return {
    kind: 'individual',
    generatedAt: generatedPlan.generatedAt,
    modelVersion: generatedPlan.modelVersion,
    inputSummary: {
      athleteId: profile.athleteId,
      goals: input.goals || [],
      days: generatedPlan.summary.days,
      intensity,
      sessionDurationMinutes,
      sessionsPerWeek: generatedPlan.summary.totalSessions
    },
    sessions: generatedPlan.sessions,
    metrics: {
      durationTotalMinutes: generatedPlan.summary.totalDurationMinutes,
      estimatedLoadTotal: 0, // Se puede calcular si es necesario
      sessionsCount: generatedPlan.summary.totalSessions,
      exercisesCount: generatedPlan.summary.totalExercises
    }
  };
};

const generateGroup = async (input) => {
  validateGroupInput(input);

  const group = input.group;
  const intensity = group.intensity || 'medium';
  const maxSessionsPerWeek = group.maxSessionsPerWeek || 4;
  const sessionDurationMinutes = group.sessionDurationMinutes || 90;
  const days = normalizeDays(input.constraints && input.constraints.days);

  // Obtener ejercicios disponibles
  const allExercises = await getAllExercisesForRecommender({ active: true });
  
  // Obtener el modelo de recomendación activo
  const recommender = getActiveModel();
  
  // Para grupos, usar un nivel promedio basado en los perfiles
  const avgLevel = deriveAverageLevel(input.profiles);
  
  // Preparar parámetros para el modelo
  const planParams = {
    goals: input.goals || [],
    constraints: {
      equipment: (input.constraints && input.constraints.equipment) || [],
      injuries: [] // Para grupos no consideramos lesiones individuales en la planificación general
    },
    profile: {
      level: avgLevel,
      intensity,
      sessionDurationMinutes,
      maxDurationMinutes: group.maxDurationMinutes || null
    },
    numberOfSessions: Math.min(maxSessionsPerWeek, days.length),
    days
  };
  
  // Generar planificación usando el modelo de recomendación
  const generatedPlan = recommender.generatePlan(allExercises, planParams);

  const perAthlete = input.profiles.map((p) => ({
    athleteId: p.athleteId,
    level: p.level || 'intermediate',
    position: p.position
  }));

  return {
    kind: 'group',
    generatedAt: generatedPlan.generatedAt,
    modelVersion: generatedPlan.modelVersion,
    inputSummary: {
      groupId: group.groupId,
      groupName: group.name,
      athletesCount: input.profiles.length,
      goals: input.goals || [],
      days: generatedPlan.summary.days,
      intensity,
      sessionDurationMinutes,
      sessionsPerWeek: generatedPlan.summary.totalSessions
    },
    athletes: perAthlete,
    sessions: generatedPlan.sessions,
    metrics: {
      durationTotalMinutes: generatedPlan.summary.totalDurationMinutes,
      estimatedLoadTotal: 0,
      sessionsCount: generatedPlan.summary.totalSessions,
      exercisesCount: generatedPlan.summary.totalExercises
    }
  };
};

module.exports = {
  generateIndividual,
  generateGroup
};
