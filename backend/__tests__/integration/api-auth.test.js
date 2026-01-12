/**
 * Basic Integration tests for API endpoints
 * These tests verify authentication requirements only (no DB needed)
 */

const request = require('supertest');
const app = require('../../app');
const { signTestToken } = require('../helpers/jwtTestHelper');

describe('API Authentication', () => {
  let adminToken;

  beforeAll(() => {
    adminToken = signTestToken({ id: 1, role: 'admin' });
  });

  describe('Protected endpoints require authentication', () => {
    it('GET /api/users returns 401 without token', async () => {
      const response = await request(app).get('/api/users');
      expect(response.status).toBe(401);
    });

    it('GET /api/clubs returns 401 without token', async () => {
      const response = await request(app).get('/api/clubs');
      expect(response.status).toBe(401);
    });

    it('GET /api/teams returns 401 without token', async () => {
      const response = await request(app).get('/api/teams');
      expect(response.status).toBe(401);
    });

    it('GET /api/exercises returns 401 without token', async () => {
      const response = await request(app).get('/api/exercises');
      expect(response.status).toBe(401);
    });

    it('GET /api/training-plans returns 401 without token', async () => {
      const response = await request(app).get('/api/training-plans');
      expect(response.status).toBe(401);
    });
  });

  describe('Invalid token handling', () => {
    it('returns 403 with invalid token', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid-token-here');
      expect(response.status).toBe(403);
    });

    it('returns 401 with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'NotBearer token');
      expect(response.status).toBe(401);
    });
  });
});
