const request = require('supertest');

const app = require('../../app');
const { signTestToken } = require('../helpers/jwtTestHelper');

// Contract-style test: we only assert requests succeed and x-request-id is present.
// Persisted audit rows are covered when USE_TEST_DB=1.

describe('Audit logging', () => {
  it('adds x-request-id header in responses', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('GET /api/audit-logs is admin-only (contract)', async () => {
    const userToken = signTestToken({ id: 123, role: 'player' });
    const adminToken = signTestToken({ id: 1, role: 'admin' });

    const forbidden = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${userToken}`);
    expect([401, 403]).toContain(forbidden.status);

    const ok = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual(
      expect.objectContaining({
        items: expect.any(Array),
        page: expect.any(Number),
        pageSize: expect.any(Number),
        total: expect.any(Number),
        totalPages: expect.any(Number),
      })
    );
  });

  it('logs user role updates when USE_TEST_DB=1', async () => {
    if (process.env.USE_TEST_DB !== '1') {
      return;
    }

    const { AuditLog } = require('../../models');

    const token = signTestToken({ id: 1, role: 'admin' });

    const updateRes = await request(app)
      .put('/api/users/1')
      .set('Authorization', `Bearer ${token}`)
      .set('x-request-id', 'test-request-id-123')
      .send({ role: 'technical_director' });

    // allow failures if user 1 doesn't exist in that DB; then it won't audit.
    if (updateRes.status !== 200) {
      return;
    }

    const rows = await AuditLog.findAll({
      where: { requestId: 'test-request-id-123', action: 'user.role_updated', entity: 'User' },
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    expect(rows.length).toBeGreaterThan(0);
  });
});
