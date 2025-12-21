
require('dotenv').config();

const app = require('./app');
const logger = require('./src/middlewares/logger');

const SERVER_PORT = process.env.SERVER_PORT || 4000;

app.listen(SERVER_PORT, () => {
  logger.info(`Server is running on port ${SERVER_PORT}`);
});