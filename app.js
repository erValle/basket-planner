const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const app = express();

const logger = require('./src/middlewares/logger');
const { authenticateToken } = require('./src/middlewares/auth');

const usersRouter = require('./routes/userRouter');
const authRouter = require('./routes/authRouter');
const exercisesRouter = require('./routes/exercisesRouter');
const {sequelize} = require('./models');
const { errorHandler } = require('./src/middlewares/errorHandler');

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

app.use('/auth', authRouter);
app.use('/users', authenticateToken, usersRouter);
app.use('/exercises', authenticateToken, exercisesRouter);

app.use(errorHandler);

module.exports = app;
