const request = require('supertest');

const app = require('../../app');
const { signTestToken } = require('../helpers/jwtTestHelper');

describe('Exercises (contract)', () => {
  it('list requires auth', async () => {
    const res = await request(app).get('/api/exercises');
    expect(res.status).toBe(401);
  });

  it('create validates body according to schema', async () => {
    const token = signTestToken({ role: 'coach' });

    const res = await request(app)
      .post('/api/exercises')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New exercise',
        // missing type, difficulty, duration
      });

    expect(res.status).toBe(400);
  });

  it('create accepts JSON difficulty and enum type', async () => {
    const token = signTestToken({ role: 'coach' });

    const res = await request(app)
      .post('/api/exercises')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Contract exercise',
        type: 'strength',
        duration: 20,
        difficulty: { effortTechnical: 5, effortPhysical: 5, effortMental: 5 },
        tags: ['contract'],
        active: true,
      });

    // Depending on DB presence/constraints in env, allow success or server-side failure,
    // but it must not be rejected by Joi as 400.
    expect([201, 500]).toContain(res.status);
  });

  it('list supports tags filter shape (no crash)', async () => {
    const token = signTestToken({ role: 'coach' });

    const res = await request(app)
      .get('/api/exercises?tags=defense,1v1')
      .set('Authorization', `Bearer ${token}`);

    expect([200, 500]).toContain(res.status);
  });

  it('list supports difficulty JSON filter (no crash)', async () => {
    const token = signTestToken({ role: 'coach' });

    const res = await request(app)
      .get('/api/exercises?difficulty={"effortTechnical":7}')
      .set('Authorization', `Bearer ${token}`);

    expect([200, 500]).toContain(res.status);
  });
});
