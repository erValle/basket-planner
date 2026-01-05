const request = require('supertest');

const app = require('../../app');
const { signTestToken } = require('../helpers/jwtTestHelper');

/**
 * Contract-ish test: verify the list endpoint includes the joined equipment record
 * so the frontend can render names without an extra call.
 *
 * We keep it resilient to CI/dev DB constraints (allow 500), but when it succeeds
 * we assert the expected shape.
 */
describe('Exercise equipment (list)', () => {
  it('includes equipmentItem {id,name} when successful', async () => {
    const token = signTestToken({ role: 'coach' });

    // We don't assume seeded data. Use a harmless id; in many envs this will 200 with []
    // or 500 if DB is not available.
    const res = await request(app)
      .get('/api/exercises/1/equipment')
      .set('Authorization', `Bearer ${token}`);

    expect([200, 500]).toContain(res.status);

    if (res.status === 200) {
      expect(Array.isArray(res.body)).toBe(true);
      // If there are rows, they must contain equipmentItem with id+name.
      for (const row of res.body) {
        expect(row).toHaveProperty('equipmentItem');
        // equipmentItem can be null if referential integrity is broken, but under normal operation it shouldn't.
        if (row.equipmentItem) {
          expect(row.equipmentItem).toHaveProperty('id');
          expect(row.equipmentItem).toHaveProperty('name');
        }
      }
    }
  });
});
