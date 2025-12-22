const request = require('supertest');

const app = require('../../app');
const { signTestToken } = require('../helpers/jwtTestHelper');

describe('Training plan versioning (contract)', () => {
  it('activate endpoint requires auth', async () => {
    const res = await request(app).post('/api/training-plans/1/versions/1/activate');
    expect(res.status).toBe(401);
  });

  it('activate endpoint with auth but missing plan/version returns 404 or 500 (depending on DB)', async () => {
    const token = signTestToken({ role: 'coach' });

    const res = await request(app)
      .post('/api/training-plans/999999/versions/999999/activate')
      .set('Authorization', `Bearer ${token}`);

    expect([400, 404, 500]).toContain(res.status);
  });
});
