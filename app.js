var express = require('express');
var path = require('path');
const app = express();

const sequelize = require('./models');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;
