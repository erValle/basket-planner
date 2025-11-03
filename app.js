var express = require('express');
var path = require('path');
const app = express();

const logger = require('./src/middlewares/logger');
const { authenticateToken } = require('./src/middlewares/auth');

const usersRouter = require('./routes/userRouter');
const authRouter = require('./routes/authRouter');
const {sequelize} = require('./models');

app.use(logger);

app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => { res.json({ status: 'OK' }); });

app.use('/auth', authRouter);
app.use('/users', authenticateToken, usersRouter);

module.exports = app;
