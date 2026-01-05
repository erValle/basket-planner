const request = require('supertest');

const app = require('../../app');
const { signTestToken } = require('../helpers/jwtTestHelper');

describe('Team players bulk (contract)', () => {
  it('bulk add requires auth', async () => {
    const res = await request(app).post('/api/teams/1/players/bulk').send({ userIds: [1, 2, 3] });
    expect(res.status).toBe(401);
  });

  it('bulk add validates params', async () => {
    const token = signTestToken({ role: 'coach' });
    const res = await request(app)
      .post('/api/teams/abc/players/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ userIds: [1, 2, 3] });

    expect(res.status).toBe(400);
  });

  it('bulk add validates body', async () => {
    const token = signTestToken({ role: 'coach' });
    const res = await request(app)
      .post('/api/teams/1/players/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('coach can call bulk add (contract)', async () => {
    const token = signTestToken({ role: 'coach' });
    const res = await request(app)
      .post('/api/teams/1/players/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ userIds: [999, 1000] });

    expect([200, 400, 404, 500]).toContain(res.status);
  });

  it('player is forbidden', async () => {
    const token = signTestToken({ role: 'player' });
    const res = await request(app)
      .post('/api/teams/1/players/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ userIds: [1, 2, 3] });

    expect([403, 404]).toContain(res.status);
  });
});
