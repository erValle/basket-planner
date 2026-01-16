const express = require('express');
const router = express.Router();

const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');

const { Op } = require('sequelize');

const { AuditLog, TrainingPlan, Exercise, TrainingPlanVersion } = require('../models');

const { createAuditLog } = require('../src/services/auditLogService');
const { getModelInfo, getModelConfig } = require('../src/recommender/modelManager');

router.use(requireAuth);

// CU.030: Monitorización del sistema - solo admin
router.use(requireAnyRole('admin'));

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

const parseRange = (body) => {
  const from = body?.from ? new Date(body.from) : null;
  const to = body?.to ? new Date(body.to) : null;

  const safeFrom = from && !isNaN(from.getTime()) ? from : null;
  const safeTo = to && !isNaN(to.getTime()) ? to : null;

  // If both are provided and swapped, normalize.
  if (safeFrom && safeTo && safeFrom.getTime() > safeTo.getTime()) {
    return { from: safeTo, to: safeFrom };
  }
  return { from: safeFrom, to: safeTo };
};

/**
 * Backend KPIs based on business action audit_logs:
 * Since we no longer log HTTP requests, we calculate metrics based on business actions
 * - totalActions: count of business actions in the period
 * - actionsPerDay: average actions per day
 * - errorRatePct: % of UNAUTHORIZED_ACCESS_ATTEMPT or other error actions
 */
async function computeBackendKpis({ from, to }) {
  if (!AuditLog) {
    // Contract/test mode without DB
    return { totalActions: 0, actionsPerDay: 0, errorRatePct: 0 };
  }

  const where = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[Op.gte] = from;
    if (to) where.createdAt[Op.lte] = to;
  }

  const rows = await AuditLog.findAll({
    where,
    attributes: ['action', 'createdAt'],
    order: [['createdAt', 'ASC']],
  });

  const total = rows.length;
  if (!total) return { totalActions: 0, actionsPerDay: 0, errorRatePct: 0 };

  // Count error-related actions (UNAUTHORIZED_ACCESS_ATTEMPT, etc.)
  const errorActions = ['UNAUTHORIZED_ACCESS_ATTEMPT'];
  const errors = rows.filter((r) => 
    errorActions.some(err => r.action.includes(err)) || 
    r.action.includes('.error') || 
    r.action.endsWith('.failed')
  ).length;

  // Calculate days in range
  const startedAt = rows[0].createdAt ? new Date(rows[0].createdAt).getTime() : Date.now();
  const endedAt = rows[rows.length - 1].createdAt ? new Date(rows[rows.length - 1].createdAt).getTime() : Date.now();
  const days = Math.max((endedAt - startedAt) / (1000 * 60 * 60 * 24), 1);

  return {
    totalActions: total,
    actionsPerDay: Math.round((total / days) * 10) / 10,
    errorRatePct: Math.round((errors / total) * 1000) / 10, // 1 decimal
  };
}

async function computeExportKpis({ from, to }) {
  if (!AuditLog) return { exportsPerDay: 0, failuresPerDay: 0 };

  const where = { entity: 'Export' };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[Op.gte] = from;
    if (to) where.createdAt[Op.lte] = to;
  }

  const rows = await AuditLog.findAll({ where, attributes: ['action'] });
  const total = rows.length;
  const failures = rows.filter((r) => typeof r.action === 'string' && (r.action.includes('.error') || r.action.endsWith('.failed'))).length;

  // If range is absent, treat as "per day" = totals (we can't infer period).
  const days = from && to ? Math.max((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24), 1) : 1;

  return {
    exportsPerDay: Math.round((total / days) * 10) / 10,
    failuresPerDay: Math.round((failures / days) * 10) / 10,
  };
}

async function computeOverview({ from, to }) {
  const backend = await computeBackendKpis({ from, to });
  const exports = await computeExportKpis({ from, to });

  // Recommender still uses placeholder state via /api/recommender; we expose stable KPIs here.
  // If later moved to DB, replace these with real measurements.
  const recommender = {
    activeVersion: 'rec-0.0.0',
    lastRunAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    techCost: 'low',
    cpuPct: clamp(25, 0, 100),
    ramPct: clamp(40, 0, 100),
  };

  return { backend, recommender, exports };
}

router.post('/overview', async (req, res, next) => {
  try {
    const range = parseRange(req.body);
    res.json(await computeOverview(range));
  } catch (e) {
    next(e);
  }
});

router.post('/backend', async (req, res, next) => {
  try {
    const range = parseRange(req.body);
    res.json(await computeBackendKpis(range));
  } catch (e) {
    next(e);
  }
});

router.post('/recommender', async (req, res, next) => {
  try {
    const range = parseRange(req.body);
    res.json((await computeOverview(range)).recommender);
  } catch (e) {
    next(e);
  }
});

router.post('/export.csv', async (req, res, next) => {
  try {
    const range = parseRange(req.body);
    const o = await computeOverview(range);
    
    // Obtener datos reales del recomendador
    const modelInfo = getModelInfo();
    const config = getModelConfig();
    
    // Estadísticas reales
    const totalPlans = await TrainingPlan.count();
    const totalExercises = await Exercise.count();
    
    // Top ejercicios
    const versionsWithSessions = await TrainingPlanVersion.findAll({
      where: { sessions: { [Op.ne]: null } },
      attributes: ['id', 'sessions'],
      limit: 100
    });
    
    const exerciseCounts = {};
    versionsWithSessions.forEach(version => {
      const sessions = version.sessions?.sessions || [];
      sessions.forEach(session => {
        (session.blocks || []).forEach(block => {
          (block.exercises || []).forEach(ex => {
            const name = ex.name || 'Sin nombre';
            exerciseCounts[name] = (exerciseCounts[name] || 0) + 1;
          });
        });
      });
    });
    
    const topExercises = Object.entries(exerciseCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => `${name} (${count})`);
    
    // Top objetivos
    const plansWithGoals = await TrainingPlan.findAll({
      where: { goal: { [Op.ne]: null } },
      attributes: ['goal']
    });
    
    const goalCounts = {};
    plansWithGoals.forEach(plan => {
      if (plan.goal) {
        goalCounts[plan.goal] = (goalCounts[plan.goal] || 0) + 1;
      }
    });
    
    const topGoals = Object.entries(goalCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([goal, count]) => `${goal} (${count})`);
    
    // Config del modelo
    const totalGoals = config?.goalToTags ? Object.keys(config.goalToTags).length : 0;
    const totalWeights = config?.weights ? Object.keys(config.weights).length : 0;
    
    const exportDate = new Date().toISOString();

    // Escape CSV fields properly
    const escapeCSV = (str) => {
      if (str === null || str === undefined) return '';
      const stringValue = String(str);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Remove accents and special characters
    const removeAccents = (str) => {
      if (!str) return '';
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };

    const csv = [
      // Header row
      'export_date,backend_status,backend_total_actions,backend_actions_per_day,backend_error_rate_pct,recommender_active_version,recommender_description,recommender_type,recommender_tech_cost,recommender_total_goals,recommender_total_weights,statistics_created_plans,statistics_available_exercises,statistics_top_exercises,statistics_top_goals,exports_per_day,exports_failures_per_day',
      // Data row
      [
        exportDate,
        'Operational',
        o.backend.totalActions,
        o.backend.actionsPerDay,
        o.backend.errorRatePct,
        escapeCSV(modelInfo?.version || 'unknown'),
        escapeCSV(removeAccents(modelInfo?.description || '')),
        escapeCSV(modelInfo?.type || 'unknown'),
        escapeCSV(modelInfo?.techCost || 'low'),
        totalGoals,
        totalWeights,
        totalPlans,
        totalExercises,
        escapeCSV(removeAccents(topExercises.join('; '))),
        escapeCSV(removeAccents(topGoals.join('; '))),
        o.exports.exportsPerDay,
        o.exports.failuresPerDay,
      ].join(','),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv;charset=utf-8');
    res.status(200).send(csv);

    // Record export event (safe no-op if DB isn't initialized)
    await createAuditLog({
      user: req.user,
      action: 'export.success',
      entity: 'Export',
      requestId: req.requestId,
      metadata: { type: 'monitoring', format: 'csv' },
    });
  } catch (e) {
    console.error('Error in /export.csv:', e);
    try {
      await createAuditLog({
        user: req.user,
        action: 'export.failed',
        entity: 'Export',
        requestId: req.requestId,
        metadata: { type: 'monitoring', format: 'csv', error: e?.message ?? 'unknown' },
      });
    } catch {
      // ignore
    }
    next(e);
  }
});

module.exports = router;
