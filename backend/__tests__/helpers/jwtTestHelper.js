const jwt = require('jsonwebtoken');

const config = require('../../config/config');

const JWT_ISSUER = 'tfg-api';
const JWT_AUDIENCE = 'tfg-web';

const signTestToken = ({
  id = 1,
  email = 'test@example.com',
  name = 'Test User',
  role = 'admin',
  status = 'active',
} = {}) => {
  const secret = (config.test && config.test.auth && config.test.auth.secret) || 'test-secret';

  return jwt.sign(
    {
      sub: String(id),
      email,
      name,
      role,
      status,
    },
    secret,
    {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn: '1h',
    }
  );
};

module.exports = {
  signTestToken,
};
