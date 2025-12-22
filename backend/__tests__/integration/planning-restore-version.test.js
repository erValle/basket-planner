const request = require('supertest');

const app = require('../../app');
const { signTestToken } = require('../helpers/jwtTestHelper');

describe('Planning restore version API', () => {
  it('POST /api/planning/:id/versions/:versionId/restore without token returns 401', async () => {
    const res = await request(app)
      .post('/api/planning/1/versions/1/restore')
      .send({});
    expect(res.status).toBe(401);
  });

  it('POST /api/planning/:id/versions/:versionId/restore (contract) validates params/body', async () => {
    const token = signTestToken({ role: 'coach' });

    const res = await request(app)
      .post('/api/planning/abc/versions/def/restore')
      .set('Authorization', `Bearer ${token}`)
      .send({ comments: 'restore' });

    expect(res.status).toBe(400);
  });

  it('POST /api/planning/:id/versions/:versionId/restore creates new version and activates it when USE_TEST_DB=1', async () => {
    if (process.env.USE_TEST_DB !== '1') {
      return;
    }

    const token = signTestToken({ id: 999, role: 'coach' });

    const createRes = await request(app)
      .post('/api/planning/approve')
      .set('Authorization', `Bearer ${token}`)
      .send({
        proposal: {
          kind: 'individual',
          generatedAt: new Date().toISOString(),
          inputSummary: { athleteId: 1, sessionsPerWeek: 1 },
          sessions: [
            {
              sessionId: 'session-1',
              day: 'mon',
              focusTags: ['fundamentals'],
              exercises: [
                {
                  id: 'wu-1',
                  name: 'Warmup',
                  type: 'warmup',
                  durationMinutes: 10,
                  intensity: 'low',
                  estimatedLoad: 10,
                },
              ],
              metrics: { durationMinutes: 10, estimatedLoad: 10 },
            },
          ],
          metrics: { durationTotalMinutes: 10, estimatedLoadTotal: 10, sessionsCount: 1 },
        },
        plan: { targetType: 'user', name: 'Restorable plan', status: 'draft' },
      });

    expect(createRes.status).toBe(201);
    const planId = createRes.body.id;
    const v1Active = createRes.body.activeVersionId;

    const editRes = await request(app)
      .put(`/api/training-plans/${planId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: { kind: 'individual', sessions: [{ sessionId: 's2' }] },
        metadata: { comments: 'v2' },
      });

    expect(editRes.status).toBe(200);
    const v2Active = editRes.body.activeVersionId;
    expect(v2Active).not.toEqual(v1Active);

    const restoreRes = await request(app)
      .post(`/api/planning/${planId}/versions/${v1Active}/restore`)
      .set('Authorization', `Bearer ${token}`)
      .send({ comments: 'restore v1' });

    expect(restoreRes.status).toBe(201);
    expect(restoreRes.body.versionNumber).toBe(3);

    const getPlanRes = await request(app)
      .get(`/api/training-plans/${planId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getPlanRes.status).toBe(200);
    expect(getPlanRes.body.activeVersionId).toEqual(restoreRes.body.id);
    expect(getPlanRes.body.activeVersionId).not.toEqual(v2Active);

    const versions = getPlanRes.body.versions || [];
    const restored = versions.find((v) => v.id === restoreRes.body.id);
    const original = versions.find((v) => v.id === v1Active);

    expect(restored).toBeDefined();
    expect(original).toBeDefined();
    expect(restored.items).toEqual(original.items);
  });
});
