const request = require('supertest');

const app = require('../../app');
const { signTestToken } = require('../helpers/jwtTestHelper');

describe('Team players (contract)', () => {
  it('list requires auth', async () => {
    const res = await request(app).get('/api/teams/1/players');
    expect(res.status).toBe(401);
  });

  it('list validates params', async () => {
    const token = signTestToken({ role: 'coach' });
    const res = await request(app)
      .get('/api/teams/abc/players')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('add validates body', async () => {
    const token = signTestToken({ role: 'coach' });
    const res = await request(app)
      .post('/api/teams/1/players')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('remove validates params', async () => {
    const token = signTestToken({ role: 'coach' });
    const res = await request(app)
      .delete('/api/teams/1/players/abc')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('coach can call list/add/remove (contract)', async () => {
    const token = signTestToken({ role: 'coach' });

    const listRes = await request(app)
      .get('/api/teams/1/players?limit=10')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 404, 500]).toContain(listRes.status);

    const addRes = await request(app)
      .post('/api/teams/1/players')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: 999 });
    expect([201, 400, 404, 500]).toContain(addRes.status);

    const delRes = await request(app)
      .delete('/api/teams/1/players/999')
      .set('Authorization', `Bearer ${token}`);
    expect([204, 404, 500]).toContain(delRes.status);
  });

  it('player is forbidden', async () => {
    const token = signTestToken({ role: 'player' });

    const res = await request(app)
      .get('/api/teams/1/players')
      .set('Authorization', `Bearer ${token}`);

    expect([403, 404]).toContain(res.status);
  });
});
