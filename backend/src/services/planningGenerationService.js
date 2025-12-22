const { StatusCodes } = require('http-status-codes');
const { httpError } = require('../libs/errorHelper');

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

const generateIndividual = async (input) => {
  validateIndividualInput(input);

  const profile = input.profile;
  const intensity = profile.intensity || 'medium';
  const maxSessionsPerWeek = profile.maxSessionsPerWeek || 4;
  const sessionDurationMinutes = profile.sessionDurationMinutes || 75;
  const days = normalizeDays(input.constraints && input.constraints.days);
  const focusTags = deriveFocusTags(input.goals);

  const sessionsToGenerate = Math.min(maxSessionsPerWeek, days.length);
  const sessions = [];

  for (let i = 0; i < sessionsToGenerate; i += 1) {
    sessions.push(
      buildSession({
        sessionIndex: i + 1,
        day: days[i],
        durationMinutes: sessionDurationMinutes,
        intensity,
        focusTags
      })
    );
  }

  const metrics = computePlanMetrics(sessions);

  return {
    kind: 'individual',
    generatedAt: new Date().toISOString(),
    inputSummary: {
      athleteId: profile.athleteId,
      goals: input.goals || [],
      days,
      intensity,
      sessionDurationMinutes,
      sessionsPerWeek: sessionsToGenerate
    },
    sessions,
    metrics
  };
};

const generateGroup = async (input) => {
  validateGroupInput(input);

  const group = input.group;
  const intensity = group.intensity || 'medium';
  const maxSessionsPerWeek = group.maxSessionsPerWeek || 4;
  const sessionDurationMinutes = group.sessionDurationMinutes || 90;
  const days = normalizeDays(input.constraints && input.constraints.days);

  const focusTags = deriveFocusTags(input.goals);
  const sessionsToGenerate = Math.min(maxSessionsPerWeek, days.length);
  const sessions = [];

  for (let i = 0; i < sessionsToGenerate; i += 1) {
    sessions.push(
      buildSession({
        sessionIndex: i + 1,
        day: days[i],
        durationMinutes: sessionDurationMinutes,
        intensity,
        focusTags
      })
    );
  }

  const perAthlete = input.profiles.map((p) => ({
    athleteId: p.athleteId,
    level: p.level || 'intermediate',
    position: p.position
  }));

  const metrics = computePlanMetrics(sessions);

  return {
    kind: 'group',
    generatedAt: new Date().toISOString(),
    inputSummary: {
      groupId: group.groupId,
      groupName: group.name,
      athletesCount: input.profiles.length,
      goals: input.goals || [],
      days,
      intensity,
      sessionDurationMinutes,
      sessionsPerWeek: sessionsToGenerate
    },
    athletes: perAthlete,
    sessions,
    metrics
  };
};

module.exports = {
  generateIndividual,
  generateGroup
};
