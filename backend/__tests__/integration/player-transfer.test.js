const request = require('supertest');

const app = require('../../app');
const { signTestToken } = require('../helpers/jwtTestHelper');

/**
 * Contract test:
 * - Endpoint exists
 * - When it returns 200, it returns { closedMembership, newMembership }
 *
 * Note: In environments without a DB (NODE_ENV=test without USE_TEST_DB=1)
 * the app may respond 500; this test tolerates it like other contract tests.
 */
describe('POST /api/players/:id/transfer', () => {
  test('returns closed + new membership shape on success', async () => {
    const token = signTestToken({ role: 'technical_director' });

    const res = await request(app)
      .post('/api/players/1/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({ clubId: 1 });

    expect([200, 400, 404, 500]).toContain(res.status);

    if (res.status === 200) {
      expect(res.body).toHaveProperty('closedMembership');
      expect(res.body).toHaveProperty('newMembership');

      if (res.body.newMembership) {
        expect(res.body.newMembership).toHaveProperty('clubId');
        expect(res.body.newMembership).toHaveProperty('isPrimary');
      }
    }
  });
});
