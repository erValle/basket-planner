const express = require('express');
const path = require('path');
require('dotenv').config();
const app = express();

const logger = require('./src/middlewares/logger');
const { requestIdMiddleware } = require('./src/middlewares/requestId');
const { requireAuth } = require('./src/middlewares/rbac');
const securityMiddleware = require('./src/middlewares/security');

const usersRouter = require('./routes/users.routes');
const authRouter = require('./routes/auth.routes');
const clubsRouter = require('./routes/clubs.routes');
const teamsRouter = require('./routes/teams.routes');
const equipmentRouter = require('./routes/equipment.routes');
const exercisesRouter = require('./routes/exercises.routes');
const userClubsRouter = require('./routes/userClubs.routes');
const playersRouter = require('./routes/players.routes');
const trainingPlansRouter = require('./routes/trainingPlans.routes');
const trainingPlanVersionsRouter = require('./routes/trainingPlanVersions.routes');
const planAssignmentsRouter = require('./routes/planAssignments.routes');
const feedbacksRouter = require('./routes/feedbacks.routes');
const metricsRouter = require('./routes/metrics.routes');
const planningRouter = require('./routes/planning.routes');
const auditLogsRouter = require('./routes/auditLogs.routes');
const monitoringRouter = require('./routes/monitoring.routes');
const recommenderRouter = require('./routes/recommender.routes');
const {sequelize} = require('./models');
const { errorHandler } = require('./src/middlewares/errorHandler');

// Apply security middleware first (helmet, CORS, rate limiting, payload limits)
securityMiddleware(app);

app.use(requestIdMiddleware);
app.use(logger);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => { res.json({ status: 'OK' }); });

app.use('/api/auth', authRouter);
app.use('/api/users', requireAuth, usersRouter);

app.use('/api/clubs', clubsRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/equipment', equipmentRouter);
app.use('/api/exercises', exercisesRouter);
app.use('/api/user-clubs', userClubsRouter);
app.use('/api/players', playersRouter);
app.use('/api/training-plans', trainingPlansRouter);
app.use('/api/training-plans/:trainingPlanId/versions', trainingPlanVersionsRouter);
app.use('/api/plan-assignments', planAssignmentsRouter);
app.use('/api/feedbacks', feedbacksRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/planning', planningRouter);
app.use('/api/exercises/:exerciseId/equipment', require('./routes/exerciseEquipment.routes'));
app.use('/api/audit-logs', auditLogsRouter);

// Supporting endpoints already used by the frontend.
app.use('/api/monitoring', monitoringRouter);
app.use('/api/recommender', recommenderRouter);

app.use(errorHandler);

module.exports = app;
