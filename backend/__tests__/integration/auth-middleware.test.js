const request = require('supertest');

const app = require('../../app');

describe('Auth middleware (smoke)', () => {
  it('GET /users without token returns 401', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('GET /exercises without token returns 401', async () => {
    const res = await request(app).get('/api/exercises');
    expect(res.status).toBe(401);
  });
});
