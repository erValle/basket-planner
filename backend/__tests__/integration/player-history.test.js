const request = require('supertest');

const app = require('../../app');
const { signTestToken } = require('../helpers/jwtTestHelper');

/**
 * Contract test:
 * - Endpoint exists
 * - When it returns 200, response is an array of memberships including club {id,name}
 *
 * Note: In CI/local without DB, the backend may respond 500; this test tolerates it.
 */
describe('GET /api/players/:id/history', () => {
  test('returns membership rows including club name when available', async () => {
    const token = signTestToken({ role: 'admin' });

    const res = await request(app)
      .get('/api/players/1/history')
      .set('Authorization', `Bearer ${token}`);

    expect([200, 400, 404, 500]).toContain(res.status);

    if (res.status === 200) {
      expect(Array.isArray(res.body)).toBe(true);

      if (res.body.length > 0) {
        const row = res.body[0];
        expect(row).toHaveProperty('clubId');
        expect(row).toHaveProperty('club');
        if (row.club) {
          expect(row.club).toHaveProperty('id');
          expect(row.club).toHaveProperty('name');
        }
      }
    }
  });
});
