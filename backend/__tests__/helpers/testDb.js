const path = require('path');
const { execSync } = require('child_process');

const run = (cmd) => execSync(cmd, { stdio: 'inherit', cwd: path.join(__dirname, '..', '..') });

const ensureTestDbEnv = () => {
  process.env.NODE_ENV = 'test';

  // Provide sensible local defaults (can be overridden by env vars).
  // This makes it easier to bootstrap a local test db without duplicating .env.
  if (!process.env.TEST_DB_HOST && !process.env.DB_HOST) {
    process.env.TEST_DB_HOST = '127.0.0.1';
  }
  if (!process.env.TEST_DB_USER && !process.env.DB_USER) {
    process.env.TEST_DB_USER = 'postgres';
  }
  if (!process.env.TEST_DB_PASSWORD && !process.env.DB_PASSWORD) {
    process.env.TEST_DB_PASSWORD = '';
  }

  if (!process.env.TEST_DB_NAME && !process.env.DB_NAME) {
    throw new Error(
      'Missing DB_NAME/TEST_DB_NAME for NODE_ENV=test. Provide test database env vars.'
    );
  }

  // DB user is required by Sequelize config, but we now default to `postgres`.

  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-secret';
  }
};

const migrate = () => {
  ensureTestDbEnv();
  run('npx sequelize db:migrate --env test');
};

const seed = () => {
  ensureTestDbEnv();
  run('npx sequelize db:seed:all --env test');
};

const reset = () => {
  ensureTestDbEnv();
  run('npx sequelize db:migrate:undo:all --env test');
  run('npx sequelize db:migrate --env test');
};

const resetAndSeed = () => {
  ensureTestDbEnv();
  run('npx sequelize db:migrate:undo:all --env test');
  run('npx sequelize db:migrate --env test');
  run('npx sequelize db:seed:all --env test');
};

module.exports = {
  ensureTestDbEnv,
  migrate,
  seed,
  reset,
  resetAndSeed
};
