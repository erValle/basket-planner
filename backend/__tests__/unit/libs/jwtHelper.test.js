/**
 * Unit tests for jwtHelper
 */

const jwt = require('jsonwebtoken');

jest.mock('../../../config/config', () => ({
  development: {
    auth: {
      secret: 'test-secret-key',
      expiresIn: '1h',
    },
  },
}));

const { tokenDecode, dataEncode, userEncode } = require('../../../src/libs/jwtHelper');

describe('jwtHelper', () => {
  describe('dataEncode', () => {
    it('encodes data into a JWT token', () => {
      const data = { userId: 1, email: 'test@test.com' };

      const token = dataEncode(data);

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('includes issuer and audience in token', () => {
      const data = { userId: 1 };

      const token = dataEncode(data);
      const decoded = jwt.decode(token);

      expect(decoded.iss).toBe('tfg-api');
      expect(decoded.aud).toBe('tfg-web');
    });

    it('includes expiration in token', () => {
      const data = { userId: 1 };

      const token = dataEncode(data);
      const decoded = jwt.decode(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
    });
  });

  describe('tokenDecode', () => {
    it('decodes a valid JWT token', () => {
      const originalData = { userId: 1, email: 'test@test.com' };
      const token = dataEncode(originalData);

      const decoded = tokenDecode(token);

      expect(decoded.userId).toBe(originalData.userId);
      expect(decoded.email).toBe(originalData.email);
    });

    it('throws error for invalid token', () => {
      expect(() => tokenDecode('invalid-token')).toThrow();
    });

    it('throws error for expired token', () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: 1 },
        'test-secret-key',
        { expiresIn: '-1h', issuer: 'tfg-api', audience: 'tfg-web' }
      );

      expect(() => tokenDecode(expiredToken)).toThrow();
    });

    it('throws error for token with wrong issuer', () => {
      const wrongIssuerToken = jwt.sign(
        { userId: 1 },
        'test-secret-key',
        { issuer: 'wrong-issuer', audience: 'tfg-web' }
      );

      expect(() => tokenDecode(wrongIssuerToken)).toThrow();
    });

    it('throws error for token with wrong audience', () => {
      const wrongAudienceToken = jwt.sign(
        { userId: 1 },
        'test-secret-key',
        { issuer: 'tfg-api', audience: 'wrong-audience' }
      );

      expect(() => tokenDecode(wrongAudienceToken)).toThrow();
    });
  });

  describe('userEncode', () => {
    it('encodes user object into JWT', () => {
      const user = {
        id: 1,
        email: 'test@test.com',
        name: 'Test User',
        role: 'admin',
        status: 'active',
      };

      const token = userEncode(user);
      const decoded = jwt.decode(token);

      expect(decoded.sub).toBe('1'); // ID is converted to string
      expect(decoded.email).toBe('test@test.com');
      expect(decoded.name).toBe('Test User');
      expect(decoded.role).toBe('admin');
      expect(decoded.status).toBe('active');
    });

    it('converts user id to string in sub claim', () => {
      const user = { id: 123, email: 'test@test.com', name: 'Test', role: 'player', status: 'active' };

      const token = userEncode(user);
      const decoded = jwt.decode(token);

      expect(decoded.sub).toBe('123');
      expect(typeof decoded.sub).toBe('string');
    });

    it('handles user with null role', () => {
      const user = { id: 1, email: 'test@test.com', name: 'Test', role: null, status: 'active' };

      const token = userEncode(user);
      const decoded = jwt.decode(token);

      expect(decoded.role).toBeNull();
    });
  });
});
