const SERVER_PORT = 4000;

const app = require('./app');
const logger = require('./src/middlewares/logger');

app.listen(SERVER_PORT, () => {
  logger.info(`Server is running on port ${SERVER_PORT}`);
});