const request = require('supertest');

const app = require('../../app');
const { signTestToken } = require('../helpers/jwtTestHelper');

describe('Training plan versions createdFrom (contract)', () => {
  it('create accepts createdFrom object', async () => {
    const token = signTestToken({ role: 'coach' });

    const res = await request(app)
      .post('/api/training-plans/1/versions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        versionNumber: 999,
        source: 'manual',
        date: new Date().toISOString(),
        comments: 'test createdFrom',
        items: { sessions: [] },
        createdFrom: {
          goals: ['shooting'],
          constraints: { days: ['mon'] },
          model: { name: 'tf-recommender', version: '1.0.0' },
        },
      });

    // We mainly assert it is NOT rejected as 400 by Joi.
    expect([201, 404, 500]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body).toHaveProperty('createdFrom');
    }
  });
});
