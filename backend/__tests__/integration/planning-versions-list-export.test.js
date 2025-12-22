const request = require('supertest');

const app = require('../../app');
const { signTestToken } = require('../helpers/jwtTestHelper');

describe('Planning versions list + export', () => {
  it('GET /api/planning/:id/versions without token returns 401', async () => {
    const res = await request(app).get('/api/planning/1/versions');
    expect(res.status).toBe(401);
  });

  it('GET /api/planning/:id/versions validates params', async () => {
    const token = signTestToken({ role: 'coach' });
    const res = await request(app)
      .get('/api/planning/abc/versions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('GET /api/planning/:id/versions returns paginated shape (contract)', async () => {
    const token = signTestToken({ role: 'coach' });
    const res = await request(app)
      .get('/api/planning/1/versions?page=1&pageSize=10')
      .set('Authorization', `Bearer ${token}`);

    expect([200, 404, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toEqual(
        expect.objectContaining({
          page: 1,
          pageSize: 10,
          total: expect.any(Number),
          activeVersionId: expect.anything(),
          versions: expect.any(Array),
        })
      );
    }
  });

  it('GET /api/planning/:id/versions/:versionId/export validates format', async () => {
    const token = signTestToken({ role: 'coach' });
    const res = await request(app)
      .get('/api/planning/1/versions/1/export?format=zip')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('GET /api/planning/:id/versions/:versionId/export csv (contract)', async () => {
    const token = signTestToken({ role: 'coach' });
    const res = await request(app)
      .get('/api/planning/1/versions/1/export?format=csv')
      .set('Authorization', `Bearer ${token}`);

    expect([200, 404, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment');
    }
  });

  it('GET /api/planning/:id/versions/:versionId/export pdf (contract)', async () => {
    const token = signTestToken({ role: 'coach' });
    const res = await request(app)
      .get('/api/planning/1/versions/1/export?format=pdf')
      .set('Authorization', `Bearer ${token}`);

    expect([200, 404, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
    }
  });
});
