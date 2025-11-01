const SERVER_PORT = 4000;

const app = require('./app');

app.listen(SERVER_PORT, () => {
  console.log(`Server is running on port ${SERVER_PORT}`);
});