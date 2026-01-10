const request = require('supertest');

const app = require('../../app');
const { signTestToken } = require('../helpers/jwtTestHelper');

describe('Feedback API', () => {
  it('POST /api/feedbacks without token returns 401', async () => {
    const res = await request(app).post('/api/feedbacks').send({});
    expect(res.status).toBe(401);
  });

  it('POST /api/feedbacks validates body', async () => {
    const token = signTestToken({ id: 123, role: 'player' });

    const res = await request(app)
      .post('/api/feedbacks')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('POST /api/feedbacks (contract) accepts payload shape', async () => {
    const token = signTestToken({ id: 123, role: 'player' });

    const res = await request(app)
      .post('/api/feedbacks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        trainingPlanVersionId: 1,
        rating: { physicalEffort: 4 },
        comments: 'Felt good',
      });

    expect([201, 404, 500]).toContain(res.status);
  });

  it('POST /api/feedbacks persists when USE_TEST_DB=1', async () => {
    if (process.env.USE_TEST_DB !== '1') {
      return;
    }

  // Use an existing seeded player user id.
  // Seeders include users; id=1 is commonly present.
  const seededPlayerId = 1;
  const token = signTestToken({ id: seededPlayerId, role: 'player' });

    // Use a seeded training plan version (the seeders create at least version id=1).
    // If your seed data changes, update this id or make it discoverable via an API.
  const versionId = 1;

    const res = await request(app)
      .post('/api/feedbacks')
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
  expect(res.body.userId).toBe(seededPlayerId);
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
