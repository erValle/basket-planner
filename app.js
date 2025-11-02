var express = require('express');
var path = require('path');
const app = express();

const logger = require('./src/middlewares/logger');

const usersRouter = require('./routes/userRouter');
const {sequelize} = require('./models');

app.use(logger);

app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);

module.exports = app;
