const request = require('supertest');

const app = require('../../app');
const { signTestToken } = require('../helpers/jwtTestHelper');

describe('Planning Generation API', () => {
  it('POST /api/planning/generate/individual without token returns 401', async () => {
    const res = await request(app)
      .post('/api/planning/generate/individual')
      .send({});

    expect(res.status).toBe(401);
  });

  it('POST /api/planning/generate/individual returns a proposal', async () => {
    const token = signTestToken({ role: 'coach' });

    const payload = {
      profile: {
        athleteId: 123,
        maxSessionsPerWeek: 3,
        sessionDurationMinutes: 60,
        intensity: 'medium'
      },
      goals: ['shooting', 'tactics'],
      constraints: {
        days: ['mon', 'wed', 'fri']
      }
    };

    const res = await request(app)
      .post('/api/planning/generate/individual')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.kind).toBe('individual');
    expect(Array.isArray(res.body.sessions)).toBe(true);
    expect(res.body.sessions.length).toBeGreaterThan(0);
    expect(res.body.metrics).toEqual(
      expect.objectContaining({
        durationTotalMinutes: expect.any(Number),
        estimatedLoadTotal: expect.any(Number),
        sessionsCount: expect.any(Number)
      })
    );
  });

  it('POST /api/planning/generate/group returns a proposal', async () => {
    const token = signTestToken({ role: 'technical_director' });

    const payload = {
      group: {
        groupId: 77,
        name: 'U18',
        maxSessionsPerWeek: 2,
        sessionDurationMinutes: 90,
        intensity: 'high'
      },
      profiles: [
        { athleteId: 1, level: 'intermediate', position: 'guard' },
        { athleteId: 2, level: 'beginner', position: 'forward' }
      ],
      goals: ['conditioning'],
      constraints: {
        days: ['tue', 'thu']
      }
    };

    const res = await request(app)
      .post('/api/planning/generate/group')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.kind).toBe('group');
    expect(res.body.athletesCount || res.body.inputSummary.athletesCount).toBeDefined();
    expect(Array.isArray(res.body.sessions)).toBe(true);
    expect(res.body.sessions.length).toBeGreaterThan(0);
  });
});
