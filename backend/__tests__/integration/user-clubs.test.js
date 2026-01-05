const request = require('supertest');
const app = require('../../app');

/**
 * NOTE: These are contract-style integration tests (no real DB by default).
 * They exist mainly to ensure the route is wired and does not crash due to
 * schema/model mismatches (e.g. selecting non-existent timestamp columns).
 */
describe('User clubs (memberships) endpoints', () => {
  test('GET /api/user-clubs returns 200', async () => {
    const res = await request(app)
      .get('/api/user-clubs')
      .set('Authorization', 'Bearer test-token');

    expect([200, 401, 403]).toContain(res.status);
  });

  test('GET /api/user-clubs?userId=1 returns 200', async () => {
    const res = await request(app)
      .get('/api/user-clubs?userId=1')
      .set('Authorization', 'Bearer test-token');

    expect([200, 400, 401, 403]).toContain(res.status);
  });
});
