require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'postgres',
    auth: {
      secret: process.env.JWT_SECRET,
      expiresIn: '5h',
    },
  },
  test: {
    username: process.env.TEST_DB_USER || process.env.DB_USER,
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.TEST_DB_NAME || process.env.DB_NAME,
    host: process.env.TEST_DB_HOST || process.env.DB_HOST,
    dialect: 'postgres',
    logging: false,
    auth: {
      secret: process.env.JWT_SECRET || 'test-secret',
      expiresIn: '5h',
    },
  },
};
