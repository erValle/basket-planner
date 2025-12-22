const request = require('supertest');

const app = require('../../app');
const { signTestToken } = require('../helpers/jwtTestHelper');

describe('Planning approve API', () => {
  it('POST /api/planning/approve without token returns 401', async () => {
    const res = await request(app).post('/api/planning/approve').send({});
    expect(res.status).toBe(401);
  });

  it('POST /api/planning/approve with token validates body', async () => {
    const token = signTestToken({ role: 'coach' });
    const res = await request(app)
      .post('/api/planning/approve')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('POST /api/planning/approve persists plan+version when USE_TEST_DB=1', async () => {
    if (process.env.USE_TEST_DB !== '1') {
      return;
    }

    const token = signTestToken({ id: 999, role: 'coach' });

    const proposal = {
      kind: 'individual',
      generatedAt: new Date().toISOString(),
      inputSummary: { athleteId: 123, sessionsPerWeek: 1 },
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
              estimatedLoad: 10
            }
          ],
          metrics: { durationMinutes: 10, estimatedLoad: 10 }
        }
      ],
      metrics: { durationTotalMinutes: 10, estimatedLoadTotal: 10, sessionsCount: 1 }
    };

    const body = {
      proposal,
      plan: {
        targetType: 'user',
        name: 'Approved plan',
        status: 'draft'
      }
    };

    const res = await request(app)
      .post('/api/planning/approve')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        createdById: 999,
        activeVersionId: expect.any(Number)
      })
    );
  });
});
