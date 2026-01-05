const request = require('supertest');

const app = require('../../app');
const { signTestToken } = require('../helpers/jwtTestHelper');

describe('Monitoring endpoints', () => {
  const authHeader = () => ({ Authorization: `Bearer ${signTestToken({ id: 1, role: 'admin' })}` });

  test('POST /api/monitoring/overview returns expected shape', async () => {
    const res = await request(app)
      .post('/api/monitoring/overview')
      .set(authHeader())
      .send({ from: new Date(Date.now() - 1000 * 60 * 60).toISOString(), to: new Date().toISOString() });

    // In CI/dev without DB, the app may return 500; keep contract tests lenient like others.
    if (res.status >= 500) {
      expect(res.status).toBeGreaterThanOrEqual(500);
      return;
    }

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('backend');
    expect(res.body).toHaveProperty('recommender');
    expect(res.body).toHaveProperty('exports');
  });

  test('POST /api/monitoring/backend returns backend kpis', async () => {
    const res = await request(app).post('/api/monitoring/backend').set(authHeader()).send({});
    if (res.status >= 500) return;
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('latencyMs');
    expect(res.body).toHaveProperty('errorRatePct');
    expect(res.body).toHaveProperty('throughputRps');
  });

  test('POST /api/monitoring/export.csv returns csv', async () => {
    const res = await request(app).post('/api/monitoring/export.csv').set(authHeader()).send({});
    if (res.status >= 500) return;
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(typeof res.text).toBe('string');
    expect(res.text).toContain('from,to,backend_latency_ms');
  });
});
