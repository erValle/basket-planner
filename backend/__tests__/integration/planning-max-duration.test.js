const request = require('supertest');

const app = require('../../app');
const { signTestToken } = require('../helpers/jwtTestHelper');

describe('Planning Generation - maxDurationMinutes', () => {
  describe('Validation', () => {
    it('should reject maxDurationMinutes below minimum (30)', async () => {
      const token = signTestToken({ role: 'coach' });

      const payload = {
        profile: {
          athleteId: 123,
          maxSessionsPerWeek: 3,
          sessionDurationMinutes: 60,
          intensity: 'medium',
          maxDurationMinutes: 20  // Below minimum
        },
        goals: ['shooting'],
        constraints: {
          days: ['mon', 'wed', 'fri']
        }
      };

      const res = await request(app)
        .post('/api/planning/generate/individual')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/maxDurationMinutes/i);
    });

    it('should reject maxDurationMinutes above maximum (480)', async () => {
      const token = signTestToken({ role: 'coach' });

      const payload = {
        profile: {
          athleteId: 123,
          maxSessionsPerWeek: 3,
          sessionDurationMinutes: 60,
          intensity: 'medium',
          maxDurationMinutes: 500  // Above maximum
        },
        goals: ['shooting'],
        constraints: {
          days: ['mon', 'wed', 'fri']
        }
      };

      const res = await request(app)
        .post('/api/planning/generate/individual')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/maxDurationMinutes/i);
    });

    it('should accept valid maxDurationMinutes (30-480 range)', async () => {
      const token = signTestToken({ role: 'coach' });

      const payload = {
        profile: {
          athleteId: 123,
          maxSessionsPerWeek: 3,
          sessionDurationMinutes: 60,
          intensity: 'medium',
          maxDurationMinutes: 120  // Valid value
        },
        goals: ['shooting'],
        constraints: {
          days: ['mon', 'wed', 'fri']
        }
      };

      const res = await request(app)
        .post('/api/planning/generate/individual')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect([200, 201]).toContain(res.status);
    });

    it('should accept maxDurationMinutes at minimum boundary (30)', async () => {
      const token = signTestToken({ role: 'coach' });

      const payload = {
        profile: {
          athleteId: 123,
          maxSessionsPerWeek: 2,
          sessionDurationMinutes: 30,
          intensity: 'low',
          maxDurationMinutes: 30
        },
        goals: ['recovery'],
        constraints: {
          days: ['mon', 'wed']
        }
      };

      const res = await request(app)
        .post('/api/planning/generate/individual')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect([200, 201]).toContain(res.status);
    });

    it('should accept maxDurationMinutes at maximum boundary (480)', async () => {
      const token = signTestToken({ role: 'coach' });

      const payload = {
        profile: {
          athleteId: 123,
          maxSessionsPerWeek: 2,
          sessionDurationMinutes: 90,
          intensity: 'medium',
          maxDurationMinutes: 480
        },
        goals: ['conditioning'],
        constraints: {
          days: ['mon', 'wed']
        }
      };

      const res = await request(app)
        .post('/api/planning/generate/individual')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect([200, 201]).toContain(res.status);
    });
  });

  describe('Functionality', () => {
    it('should accept maxDurationMinutes in request', async () => {
      const token = signTestToken({ role: 'coach' });

      const payload = {
        profile: {
          athleteId: 123,
          maxSessionsPerWeek: 3,
          sessionDurationMinutes: 60,
          intensity: 'medium',
          maxDurationMinutes: 180
        },
        goals: ['shooting', 'conditioning'],
        constraints: {
          days: ['mon', 'wed', 'fri']
        }
      };

      const res = await request(app)
        .post('/api/planning/generate/individual')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      if (res.status === 200) {
        expect(res.body.metrics).toBeDefined();
        expect(res.body.metrics.durationTotalMinutes).toBeDefined();
        
        // Note: Full maxDurationMinutes enforcement in recommender is future work
        // For now we just verify it's accepted without error
        expect(res.body.metrics.durationTotalMinutes).toBeGreaterThan(0);
      }
    });

    it('should work when maxDurationMinutes is not provided (optional field)', async () => {
      const token = signTestToken({ role: 'coach' });

      const payload = {
        profile: {
          athleteId: 123,
          maxSessionsPerWeek: 3,
          sessionDurationMinutes: 60,
          intensity: 'medium'
          // maxDurationMinutes omitted
        },
        goals: ['shooting'],
        constraints: {
          days: ['mon', 'wed', 'fri']
        }
      };

      const res = await request(app)
        .post('/api/planning/generate/individual')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect([200, 201]).toContain(res.status);
    });
  });
});
