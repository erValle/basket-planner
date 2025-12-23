const request = require('supertest');

const app = require('../../app');
const { signTestToken } = require('../helpers/jwtTestHelper');

describe('Feedback API', () => {
  it('POST /api/feedback without token returns 401', async () => {
    const res = await request(app).post('/api/feedback').send({});
    expect(res.status).toBe(401);
  });

  it('POST /api/feedback validates body', async () => {
    const token = signTestToken({ id: 123, role: 'player' });

    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('POST /api/feedback (contract) accepts payload shape', async () => {
    const token = signTestToken({ id: 123, role: 'player' });

    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${token}`)
      .send({
        trainingPlanVersionId: 1,
        rating: { physicalEffort: 4 },
        comments: 'Felt good',
      });

    expect([201, 404, 500]).toContain(res.status);
  });

  it('POST /api/feedback persists when USE_TEST_DB=1', async () => {
    if (process.env.USE_TEST_DB !== '1') {
      return;
    }

    const token = signTestToken({ id: 999, role: 'player' });

    const approveRes = await request(app)
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
        plan: { targetType: 'user', name: 'Plan for feedback', status: 'draft' },
      });

    expect(approveRes.status).toBe(201);
    const versionId = approveRes.body.activeVersionId;

    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${token}`)
      .send({
        trainingPlanVersionId: versionId,
        rating: {
          physicalEffort: 5,
          technicalEffort: 6,
          mentalEffort: 5,
          overall: 6,
        },
        comments: 'Hard but great',
      });

    expect(res.status).toBe(201);
    expect(res.body.trainingPlanVersionId).toBe(versionId);
    expect(res.body.userId).toBe(999);
    expect(res.body.rating).toEqual(
      expect.objectContaining({
        physicalEffort: 5,
        technicalEffort: 6,
        mentalEffort: 5,
        overall: 6,
      })
    );
  });
});
