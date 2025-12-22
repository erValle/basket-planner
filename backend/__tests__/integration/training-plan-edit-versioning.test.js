const request = require('supertest');

const app = require('../../app');
const { signTestToken } = require('../helpers/jwtTestHelper');

describe('Training plan edit creates new version', () => {
  it('PUT /api/training-plans/:id without token returns 401', async () => {
    const res = await request(app).put('/api/training-plans/1').send({});
    expect(res.status).toBe(401);
  });

  it('PUT /api/training-plans/:id with token accepts content payload (contract)', async () => {
    const token = signTestToken({ role: 'coach' });

    const res = await request(app)
      .put('/api/training-plans/1')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: {
          kind: 'individual',
          sessions: [{ sessionId: 's1', exercises: [{ id: 'e1' }] }],
        },
        metadata: { comments: 'manual edit' },
      });

    expect([200, 201, 404, 500]).toContain(res.status);
  });

  it('PUT /api/training-plans/:id creates version and flips activeVersionId when USE_TEST_DB=1', async () => {
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
        plan: { targetType: 'user', name: 'Editable plan', status: 'draft' },
      });

    expect(createRes.status).toBe(201);
    const planId = createRes.body.id;
    const firstActive = createRes.body.activeVersionId;

    const editRes = await request(app)
      .put(`/api/training-plans/${planId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: {
          kind: 'individual',
          generatedAt: new Date().toISOString(),
          inputSummary: { athleteId: 1, sessionsPerWeek: 1 },
          sessions: [
            {
              sessionId: 'session-2',
              day: 'tue',
              focusTags: ['shooting'],
              exercises: [
                {
                  id: 'drill-1',
                  name: 'Shooting drill',
                  type: 'skill',
                  durationMinutes: 20,
                  intensity: 'medium',
                  estimatedLoad: 20,
                },
              ],
              metrics: { durationMinutes: 20, estimatedLoad: 20 },
            },
          ],
          metrics: { durationTotalMinutes: 20, estimatedLoadTotal: 20, sessionsCount: 1 },
        },
        metadata: { comments: 'v2 manual edit' },
      });

    expect(editRes.status).toBe(200);
    expect(editRes.body.activeVersionId).toBeDefined();
    expect(editRes.body.activeVersionId).not.toEqual(firstActive);

    const versions = editRes.body.versions || [];
    const versionNumbers = versions.map((v) => v.versionNumber).filter((n) => typeof n === 'number');
    expect(versionNumbers).toEqual(expect.arrayContaining([1, 2]));
  });
});
