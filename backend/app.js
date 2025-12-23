const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const app = express();

const logger = require('./src/middlewares/logger');
const { requestIdMiddleware } = require('./src/middlewares/requestId');
const { authenticateToken } = require('./src/middlewares/auth');

const usersRouter = require('./routes/userRouter');
const authRouter = require('./routes/authRouter');
const clubsRouter = require('./routes/clubs.routes');
const teamsRouter = require('./routes/teams.routes');
const equipmentRouter = require('./routes/equipment.routes');
const exercisesRouter = require('./routes/exercises.routes');
const userClubsRouter = require('./routes/userClubs.routes');
const trainingPlansRouter = require('./routes/trainingPlans.routes');
const trainingPlanVersionsRouter = require('./routes/trainingPlanVersions.routes');
const planAssignmentsRouter = require('./routes/planAssignments.routes');
const feedbacksRouter = require('./routes/feedbacks.routes');
const feedbackRouter = require('./routes/feedback.routes');
const metricsRouter = require('./routes/metrics.routes');
const planningRouter = require('./routes/planning.routes');
const auditLogsRouter = require('./routes/auditLogs.routes');
const {sequelize} = require('./models');
const { errorHandler } = require('./src/middlewares/errorHandler');

app.use(requestIdMiddleware);
app.use(logger);

app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4000')
    .split(',')
    .map(origin => origin.trim());

app.use(cors({
    origin: function(origin, callback){
        if(!origin || allowedOrigins.includes(origin)){
            callback(null, true);
        }
        else {
            callback(new Error(`CORS blocked for origin ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/api/health', (req, res) => { res.json({ status: 'OK' }); });

app.use('/api/auth', authRouter);
app.use('/api/users', authenticateToken, usersRouter);
app.use('/api/clubs', clubsRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/equipment', equipmentRouter);
app.use('/api/exercises', exercisesRouter);
app.use('/api/user-clubs', userClubsRouter);
app.use('/api/training-plans', trainingPlansRouter);
app.use('/api/training-plans/:trainingPlanId/versions', trainingPlanVersionsRouter);
app.use('/api/plan-assignments', planAssignmentsRouter);
app.use('/api/feedbacks', feedbacksRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/planning', planningRouter);
app.use('/api/exercises/:exerciseId/equipment', require('./routes/exerciseEquipment.routes'));
app.use('/api/audit-logs', auditLogsRouter);

app.use(errorHandler);

module.exports = app;
