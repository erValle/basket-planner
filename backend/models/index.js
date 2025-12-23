'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js');
const dbConfig = config[env];
const logger = require('../src/middlewares/logger');
const db = {};

// In test runs we often want to avoid creating DB connections at import time.
// When USE_TEST_DB=1 we allow Sequelize init (for DB-backed integration tests).
const shouldInitSequelize = !(process.env.NODE_ENV === 'test' && process.env.USE_TEST_DB !== '1');

if (!shouldInitSequelize) {
  db.sequelize = null;
  db.Sequelize = Sequelize;
  module.exports = db;
} else if (!dbConfig) {
  throw new Error(
    `Missing database configuration for NODE_ENV="${env}". ` +
      'Make sure backend/config/config.js exports a matching environment key.'
  );
}

let sequelize;
if (shouldInitSequelize) {
  sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: (msg) => logger.info(msg),
  });
}

if (shouldInitSequelize) {
  fs
    .readdirSync(__dirname)
    .filter(file => {
      return (
        file.indexOf('.') !== 0 &&
        file !== basename &&
        file.slice(-3) === '.js' &&
        file.indexOf('.test.js') === -1
      );
    })
    .forEach(file => {
      const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    });
}

if (shouldInitSequelize) {
  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });
}

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

if (shouldInitSequelize && process.env.NODE_ENV !== 'test') {
  testConnection();
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
