const { StatusCodes } = require('http-status-codes');
const { httpError } = require('../libs/errorHelper');
const { getActiveModel } = require('../recommender/modelManager');
const { getAllExercisesForRecommender } = require('./exerciseService');
const { TrainingPlan, TrainingPlanVersion, Equipment } = require('../../models');
const auditLogService = require('./auditLogService');
const planAssignmentService = require('./planAssignmentService');

const intensityMultiplier = {
  low: 0.8,
  medium: 1.0,
  high: 1.2,
};

const baseLoadByType = {
  warmup: 1,
  skills: 3,
  conditioning: 4,
  strength: 5,
  tactical: 3,
  recovery: 1,
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
    estimatedLoad: load,
  };
};

const buildSession = ({ sessionIndex, day, durationMinutes, intensity, focusTags }) => {
  const warmup = buildExercise({
    id: `wu-${sessionIndex}`,
    name: 'Dynamic warm-up',
    type: 'warmup',
    minutes: Math.max(10, Math.round(durationMinutes * 0.15)),
    intensity: 'low',
  });

  const mainMinutes = Math.max(20, Math.round(durationMinutes * 0.6));
  const conditioningMinutes = Math.max(10, durationMinutes - warmup.durationMinutes - mainMinutes);

  const skills = buildExercise({
    id: `sk-${sessionIndex}`,
    name: focusTags.includes('shooting') ? 'Shooting series' : 'Ball-handling & passing',
    type: 'skills',
    minutes: Math.round(mainMinutes * 0.6),
    intensity,
  });

  const tactical = buildExercise({
    id: `ta-${sessionIndex}`,
    name: focusTags.includes('tactics') ? 'Half-court tactical sets' : 'Small-sided games',
    type: 'tactical',
    minutes: Math.round(mainMinutes * 0.4),
    intensity,
  });

  const conditioning = buildExercise({
    id: `co-${sessionIndex}`,
    name: intensity === 'high' ? 'High-intensity intervals' : 'Aerobic conditioning',
    type: 'conditioning',
    minutes: conditioningMinutes,
    intensity,
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
      estimatedLoad,
    },
  };
};

const computePlanMetrics = (sessions) => {
  const durationTotalMinutes = sessions.reduce((sum, s) => sum + s.metrics.durationMinutes, 0);
  const estimatedLoadTotal = sessions.reduce((sum, s) => sum + s.metrics.estimatedLoad, 0);
  return {
    durationTotalMinutes,
    estimatedLoadTotal,
    sessionsCount: sessions.length,
  };
};

const validateIndividualInput = (input) => {
  if (!input || typeof input !== 'object') {
    throw httpError(StatusCodes.BAD_REQUEST, 'INVALID_INPUT', 'Input must be an object');
  }

  if (!input.profile || typeof input.profile !== 'object') {
    throw httpError(StatusCodes.BAD_REQUEST, 'INVALID_PROFILE', 'profile is required');
  }

  if (!input.profile.playerId) {
    throw httpError(StatusCodes.BAD_REQUEST, 'INVALID_PROFILE', 'profile.playerId is required');
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
    throw httpError(
      StatusCodes.BAD_REQUEST,
      'INVALID_PROFILES',
      'profiles must have at least 2 athletes'
    );
  }

  assertUtcDateString(input.startDate, 'startDate');
  assertUtcDateString(input.endDate, 'endDate');
};

/**
 * Obtiene el equipamiento disponible en el sistema
 * @param {number} clubId - ID del club (opcional)
 * @returns {Promise<Set<string>>} Set con los alias de equipamiento disponible
 */
const getAvailableEquipmentAliases = async (clubId = null) => {
  try {
    const where = { status: 'available' };
    if (clubId) where.clubId = clubId;

    const equipment = await Equipment.findAll({ where });
    const aliases = new Set();

    equipment.forEach((item) => {
      // Agregar el alias principal basado en el nombre normalizado
      const normalizedName = item.name
        .toLowerCase()
        .replace(/[áàäâ]/g, 'a')
        .replace(/[éèëê]/g, 'e')
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o')
        .replace(/[úùüû]/g, 'u')
        .replace(/ñ/g, 'n');

      // Mapeo de nombres a alias
      if (normalizedName.includes('balon') || normalizedName.includes('pelota')) {
        aliases.add('balon');
        aliases.add('2_balones');
      }
      if (normalizedName.includes('cono')) aliases.add('conos');
      if (normalizedName.includes('canasta') || normalizedName.includes('aro'))
        aliases.add('canasta');
      if (normalizedName.includes('peto')) aliases.add('petos');
      if (normalizedName.includes('foam') && normalizedName.includes('pad'))
        aliases.add('foam_pad');
      if (normalizedName.includes('pizarra')) aliases.add('pizarra_tactica');
      if (normalizedName.includes('cronometro') || normalizedName.includes('temporizador'))
        aliases.add('cronometro_o_app');
      if (normalizedName.includes('colchoneta') || normalizedName.includes('mat'))
        aliases.add('colchoneta');
      if (normalizedName.includes('banda') && normalizedName.includes('elastica'))
        aliases.add('banda_elastica');
      if (normalizedName.includes('foam') && normalizedName.includes('roller'))
        aliases.add('foam_roller');
      if (normalizedName.includes('cajon') && normalizedName.includes('plio'))
        aliases.add('cajon_pliometria');
      if (normalizedName.includes('tarjeta')) aliases.add('tarjetas_colores');
      if (normalizedName.includes('silbato')) aliases.add('silbato_o_app_senal');

      // También agregar los alias del JSON si existen en characteristics
      if (item.characteristics && typeof item.characteristics === 'object') {
        const chars =
          typeof item.characteristics === 'string'
            ? JSON.parse(item.characteristics)
            : item.characteristics;

        if (chars.aliases && Array.isArray(chars.aliases)) {
          chars.aliases.forEach((alias) => aliases.add(alias));
        }
      }
    });

    return aliases;
  } catch (error) {
    console.error('Error obteniendo equipamiento disponible:', error);
    // En caso de error, retornar set vacío (no filtrar ejercicios)
    return new Set();
  }
};

/**
 * Filtra ejercicios según el equipamiento disponible
 * @param {Array<Object>} exercises - Lista de ejercicios
 * @param {Set<string>} availableEquipment - Set de equipamiento disponible
 * @returns {Array<Object>} Ejercicios filtrados
 */
const filterExercisesByEquipment = (exercises, availableEquipment) => {
  // Si no hay restricción de equipamiento, devolver todos
  if (!availableEquipment || availableEquipment.size === 0) {
    return exercises;
  }

  return exercises.filter((exercise) => {
    // Obtener materiales necesarios del ejercicio
    let materials = [];

    if (exercise.materiales_necesarios && Array.isArray(exercise.materiales_necesarios)) {
      materials = exercise.materiales_necesarios;
    } else if (exercise.tags && typeof exercise.tags === 'object') {
      const tags = typeof exercise.tags === 'string' ? JSON.parse(exercise.tags) : exercise.tags;
      materials = tags.materiales || [];
    }

    // Si el ejercicio no requiere materiales, incluirlo
    if (!materials || materials.length === 0) {
      return true;
    }

    // Verificar si todos los materiales necesarios están disponibles
    return materials.every((material) => availableEquipment.has(material));
  });
};

const deriveFocusTags = (goals) => {
  const g = (goals || []).map((x) => String(x).toLowerCase());
  const tags = [];
  if (g.some((x) => x.includes('shoot'))) tags.push('shooting');
  if (g.some((x) => x.includes('tactic') || x.includes('play'))) tags.push('tactics');
  if (g.some((x) => x.includes('strength'))) tags.push('strength');
  if (g.some((x) => x.includes('speed') || x.includes('conditioning'))) tags.push('conditioning');
  return tags.length ? tags : ['fundamentals'];
};

const generateIndividual = async (input, auditCtx = {}, options = {}) => {

  const { signal } = options;

  validateIndividualInput(input);

  const profile = input.profile;
  const intensity = profile.intensity || 'medium';
  const sessionDurationMinutes = profile.sessionDurationMinutes || 75;

  // Calcular número de sesiones (máximo 7, por defecto 3)
  const numberOfSessions =
    profile.numberOfSessions ||
    profile.maxSessionsPerWeek || // fallback a campo legacy
    3;

  // Obtener equipamiento disponible en el sistema
  const clubId = profile.clubId || (input.constraints && input.constraints.clubId) || null;
  const availableEquipment = await getAvailableEquipmentAliases(clubId);

  // Obtener ejercicios disponibles
  let allExercises = await getAllExercisesForRecommender({ active: true });

  // Filtrar ejercicios según equipamiento disponible
  allExercises = filterExercisesByEquipment(allExercises, availableEquipment);


  // Obtener el modelo de recomendación activo
  const recommender = getActiveModel();

  // Preparar parámetros para el modelo (sin days, las sesiones se generan por número)
  const planParams = {
    goals: input.goals || [],
    constraints: {
      equipment: (input.constraints && input.constraints.equipment) || [],
    },
    profile: {
      intensity,
      sessionDurationMinutes,
      maxDurationMinutes: sessionDurationMinutes, // Ahora es por sesión, no total
    },
    numberOfSessions,
  };

  // Generar planificación usando el modelo de recomendación
  const startTime = Date.now();
  const generatedPlan = await recommender.generatePlan(allExercises, planParams, { signal });

  // Si no se generaron sesiones, devolver resultado vacío
  if (!generatedPlan.sessions || generatedPlan.sessions.length === 0) {
    return {
      success: false,
      wasAborted: generatedPlan.wasAborted,
      message: 'No se pudieron generar sesiones. Intenta con menos objetivos.',
      generatedPlan: null,
    };
  }

  // Guardar en la base de datos
  const trainingPlan = await TrainingPlan.create({
    createdById: auditCtx.user?.id || null,
    targetType: 'individual',
    name:
      input.goals && input.goals.length > 0
        ? `Plan: ${input.goals[0]}`
        : 'Plan de entrenamiento individual',
    description: input.goals ? input.goals.join(', ') : null,
    goal: input.goals ? input.goals.join(', ') : null,
    type: 'generated',
    intensity,
    duration: generatedPlan.summary.totalDurationMinutes,
    sessionsCount: generatedPlan.summary.totalSessions,
    sessionDurationMinutes: sessionDurationMinutes,
    status: 'draft',
  });

  // Crear versión inicial
  const version = await TrainingPlanVersion.create({
    trainingPlanId: trainingPlan.id,
    versionNumber: 1,
    date: new Date(),
    status: 'draft',
    comments: `Versión generada automáticamente - Modelo ${generatedPlan.modelVersion}`,
    sessions: generatedPlan.sessions,
    createdFrom: {
      modelVersion: generatedPlan.modelVersion,
      generatedAt: generatedPlan.generatedAt,
      inputSummary: {
        playerId: profile.playerId,
        goals: input.goals || [],
        intensity,
        sessionDurationMinutes,
        sessionsPerWeek: generatedPlan.summary.totalSessions,
      },
    },
  });

  // Establecer como versión activa
  await trainingPlan.update({ activeVersionId: version.id });

  // Crear asignación automática para el atleta
  if (profile.playerId) {
    try {
      await planAssignmentService.createAssignment({
        trainingPlanId: trainingPlan.id,
        userId: profile.playerId,
        assignedById: auditCtx.user?.id || null,
        status: 'assigned',
        assignedAt: new Date(),
      });
    } catch (err) {
      console.error('Error creando asignación automática:', err);
    }
  }

  // Audit log
  if (auditCtx.user) {
    await auditLogService.createAuditLog({
      user: auditCtx.user,
      requestId: auditCtx.requestId,
      action: 'training_plan.generated',
      entity: 'TrainingPlan',
      entityId: trainingPlan.id,
      metadata: {
        targetType: 'individual',
        playerId: profile.playerId,
        modelVersion: generatedPlan.modelVersion,
      },
    });
  }

  // Formatear respuesta para mantener compatibilidad con el formato esperado
  const wasAborted = generatedPlan.wasAborted || false;
  const requestedSessions = generatedPlan.requestedSessions || numberOfSessions;

  return {
    id: trainingPlan.id,
    versionId: version.id,
    kind: 'individual',
    generatedAt: generatedPlan.generatedAt,
    modelVersion: generatedPlan.modelVersion,
    wasAborted,
    requestedSessions,
    partialGeneration: wasAborted && generatedPlan.sessions.length < requestedSessions,
    inputSummary: {
      playerId: profile.playerId,
      goals: input.goals || [],
      intensity,
      sessionDurationMinutes,
      sessionsPerWeek: generatedPlan.summary.totalSessions,
    },
    sessions: generatedPlan.sessions,
    metrics: {
      durationTotalMinutes: generatedPlan.summary.totalDurationMinutes,
      estimatedLoadTotal: 0, // Se puede calcular si es necesario
      sessionsCount: generatedPlan.summary.totalSessions,
      exercisesCount: generatedPlan.summary.totalExercises,
    },
  };
};

const generateGroup = async (input, auditCtx = {}, options = {}) => {
  const { signal } = options;

  validateGroupInput(input);

  const group = input.group;
  const intensity = group.intensity || 'medium';
  const sessionDurationMinutes = group.sessionDurationMinutes || 90;

  // Calcular número de sesiones (máximo 7, por defecto 3)
  const numberOfSessions =
    group.numberOfSessions ||
    group.maxSessionsPerWeek || // fallback a campo legacy
    3;

  // Obtener equipamiento disponible en el sistema
  const clubId = group.clubId || (input.constraints && input.constraints.clubId) || null;
  const availableEquipment = await getAvailableEquipmentAliases(clubId);

  // Obtener ejercicios disponibles
  let allExercises = await getAllExercisesForRecommender({ active: true });

  // Filtrar ejercicios según equipamiento disponible
  allExercises = filterExercisesByEquipment(allExercises, availableEquipment);


  // Obtener el modelo de recomendación activo
  const recommender = getActiveModel();

  // Preparar parámetros para el modelo (sin days ni level)
  const planParams = {
    goals: input.goals || [],
    constraints: {
      equipment: (input.constraints && input.constraints.equipment) || [],
    },
    profile: {
      intensity,
      sessionDurationMinutes,
      maxDurationMinutes: sessionDurationMinutes, // Ahora es por sesión, no total
    },
    numberOfSessions,
  };

  // Generar planificación usando el modelo de recomendación
  const generatedPlan = await recommender.generatePlan(allExercises, planParams, { signal });

  // Si no se generaron sesiones, devolver resultado vacío
  if (!generatedPlan.sessions || generatedPlan.sessions.length === 0) {
    return {
      success: false,
      wasAborted: generatedPlan.wasAborted,
      message: 'No se pudieron generar sesiones. Intenta con menos objetivos.',
    };
  }

  const perAthlete = input.profiles.map((p) => ({
    playerId: p.playerId,
    position: p.position,
  }));

  // Guardar en la base de datos
  const trainingPlan = await TrainingPlan.create({
    createdById: auditCtx.user?.id || null,
    targetType: 'group',
    name:
      group.name ||
      (input.goals && input.goals.length > 0
        ? `Plan grupal: ${input.goals[0]}`
        : 'Plan de entrenamiento grupal'),
    description: input.goals ? input.goals.join(', ') : null,
    goal: input.goals ? input.goals.join(', ') : null,
    type: 'generated',
    intensity,
    duration: generatedPlan.summary.totalDurationMinutes,
    sessionsCount: generatedPlan.summary.totalSessions,
    sessionDurationMinutes: sessionDurationMinutes,
    status: 'draft',
  });

  // Crear versión inicial
  const version = await TrainingPlanVersion.create({
    trainingPlanId: trainingPlan.id,
    versionNumber: 1,
    date: new Date(),
    status: 'draft',
    comments: `Versión generada automáticamente - Modelo ${generatedPlan.modelVersion}`,
    sessions: generatedPlan.sessions,
    createdFrom: {
      modelVersion: generatedPlan.modelVersion,
      generatedAt: generatedPlan.generatedAt,
      athletes: perAthlete,
      inputSummary: {
        groupId: group.groupId,
        groupName: group.name,
        athletesCount: input.profiles.length,
        goals: input.goals || [],
        intensity,
        sessionDurationMinutes,
        sessionsPerWeek: generatedPlan.summary.totalSessions,
      },
    },
  });

  // Establecer como versión activa
  await trainingPlan.update({ activeVersionId: version.id });

  // Crear asignaciones automáticas para todos los atletas del grupo
  if (input.profiles && input.profiles.length > 0) {
    const assignmentPromises = input.profiles.map(async (profile) => {
      if (profile.playerId) {
        try {
          await planAssignmentService.createAssignment({
            trainingPlanId: trainingPlan.id,
            userId: profile.playerId,
            assignedById: auditCtx.user?.id || null,
            status: 'assigned',
            assignedAt: new Date(),
          });
        } catch (err) {
          console.error(`Error creando asignación para usuario ${profile.playerId}:`, err);
        }
      }
    });

    await Promise.all(assignmentPromises);
  }

  // Audit log
  if (auditCtx.user) {
    await auditLogService.createAuditLog({
      user: auditCtx.user,
      requestId: auditCtx.requestId,
      action: 'training_plan.generated',
      entity: 'TrainingPlan',
      entityId: trainingPlan.id,
      metadata: {
        targetType: 'group',
        groupId: group.groupId,
        athletesCount: input.profiles.length,
        modelVersion: generatedPlan.modelVersion,
      },
    });
  }

  return {
    id: trainingPlan.id,
    versionId: version.id,
    kind: 'group',
    generatedAt: generatedPlan.generatedAt,
    modelVersion: generatedPlan.modelVersion,
    inputSummary: {
      groupId: group.groupId,
      groupName: group.name,
      athletesCount: input.profiles.length,
      goals: input.goals || [],
      intensity,
      sessionDurationMinutes,
      sessionsPerWeek: generatedPlan.summary.totalSessions,
    },
    athletes: perAthlete,
    sessions: generatedPlan.sessions,
    wasAborted: generatedPlan.wasAborted || false,
    requestedSessions: numberOfSessions,
    partialGeneration: generatedPlan.wasAborted && generatedPlan.sessions.length < numberOfSessions,
    metrics: {
      durationTotalMinutes: generatedPlan.summary.totalDurationMinutes,
      estimatedLoadTotal: 0,
      sessionsCount: generatedPlan.summary.totalSessions,
      exercisesCount: generatedPlan.summary.totalExercises,
    },
  };
};

module.exports = {
  generateIndividual,
  generateGroup,
};
