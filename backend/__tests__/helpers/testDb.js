const path = require('path');
const { execSync } = require('child_process');

const run = (cmd) => execSync(cmd, { stdio: 'inherit', cwd: path.join(__dirname, '..', '..') });

const ensureTestDbEnv = () => {
  process.env.NODE_ENV = 'test';

  if (!process.env.TEST_DB_NAME && !process.env.DB_NAME) {
    throw new Error(
      'Missing DB_NAME/TEST_DB_NAME for NODE_ENV=test. Provide test database env vars.'
    );
  }

  if (!process.env.TEST_DB_USER && !process.env.DB_USER) {
    throw new Error(
      'Missing DB_USER/TEST_DB_USER for NODE_ENV=test. Provide test database env vars.'
    );
  }

  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-secret';
  }
};

const migrate = () => {
  ensureTestDbEnv();
  run('npx sequelize db:migrate --env test');
};

const reset = () => {
  ensureTestDbEnv();
  run('npx sequelize db:migrate:undo:all --env test');
  run('npx sequelize db:migrate --env test');
};

module.exports = {
  ensureTestDbEnv,
  migrate,
  reset
};
