const { migrate } = require('./helpers/testDb');

module.exports = async () => {
  if (process.env.USE_TEST_DB === '1') {
    migrate();
  }
};
