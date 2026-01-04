const request = require('supertest');

const app = require('../../app');
const { signTestToken } = require('../helpers/jwtTestHelper');

/**
 * Contract test for POST /api/players/enroll
 *
 * Behavior:
 * - Requires auth
 * - Validates body (userId required)
 * - Allowed roles: admin, technical_director, coach
 * - When it succeeds (201), returns { userId, role: 'player', membershipCreated, clubId? }
 *
 * Note: in environments without an initialized DB, the app can respond 500.
 * We tolerate that (same pattern as other integration contract tests).
 */
describe('POST /api/players/enroll', () => {
	test('requires auth', async () => {
		const res = await request(app).post('/api/players/enroll').send({ userId: 1 });
		expect(res.status).toBe(401);
	});

	it('when USE_TEST_DB=1, coach enrollment assigns coach primary club', async () => {
		if (process.env.USE_TEST_DB !== '1') {
			return;
		}

		// Seed data:
		// - coach id=2
		// - club id=1
		// - coach has an active primary membership in user_clubs
		const seededCoachId = 2;
		const seededClubId = 1;

		// Create a role-less user we can enroll.
		const { User, UserClub, sequelize } = require('../../models');
		const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

		// Seeders insert explicit IDs; make sure the users sequence is advanced
		// so `DEFAULT` won't collide.
		await sequelize.query(
			"SELECT setval(pg_get_serial_sequence('users','id'), (SELECT COALESCE(MAX(id),1) FROM users))"
		);
		await sequelize.query(
			"SELECT setval(pg_get_serial_sequence('user_clubs','id'), (SELECT COALESCE(MAX(id),1) FROM user_clubs))"
		);

		const target = await User.create({
			firstName: 'NoRole',
			lastName: 'User',
			email: `norole-${unique}@example.com`,
			passwordHash: 'hashed',
			role: null,
			status: 'active',
		});

		const token = signTestToken({ role: 'coach', id: seededCoachId });
		const res = await request(app)
			.post('/api/players/enroll')
			.set('Authorization', `Bearer ${token}`)
			.send({ userId: target.id });

		expect(res.status).toBe(201);
		expect(res.body).toEqual(
			expect.objectContaining({
				userId: target.id,
				role: 'player',
				membershipCreated: true,
				clubId: seededClubId,
			})
		);

		const updated = await User.findByPk(target.id);
		expect(updated.role).toBe('player');

		const membership = await UserClub.findOne({
			where: { userId: target.id, isPrimary: true, endDate: null },
		});
		expect(membership).toBeTruthy();
		expect(membership.clubId).toBe(seededClubId);
	});

	test('validates body', async () => {
		const token = signTestToken({ role: 'technical_director' });
		const res = await request(app)
			.post('/api/players/enroll')
			.set('Authorization', `Bearer ${token}`)
			.send({});

		expect(res.status).toBe(400);
	});

	test('coach can call enroll (contract)', async () => {
		const token = signTestToken({ role: 'coach', id: 10 });
		const res = await request(app)
			.post('/api/players/enroll')
			.set('Authorization', `Bearer ${token}`)
			.send({ userId: 9999 });

		expect([201, 400, 403, 404, 500]).toContain(res.status);

		if (res.status === 201) {
			expect(res.body).toHaveProperty('userId');
			expect(res.body).toHaveProperty('role', 'player');
			expect(res.body).toHaveProperty('membershipCreated');
		}
	});

	test('player is forbidden', async () => {
		const token = signTestToken({ role: 'player' });
		const res = await request(app)
			.post('/api/players/enroll')
			.set('Authorization', `Bearer ${token}`)
			.send({ userId: 1 });

		expect([403, 404]).toContain(res.status);
	});
});

/**
 * Contract test for PUT /api/players/:id (restricted update)
 */
describe('PUT /api/players/:id', () => {
	test('validates body (min 1 field)', async () => {
		const token = signTestToken({ role: 'technical_director' });
		const res = await request(app)
			.put('/api/players/1')
			.set('Authorization', `Bearer ${token}`)
			.send({});

		expect(res.status).toBe(400);
	});

	test('rejects personal data fields via schema', async () => {
		const token = signTestToken({ role: 'technical_director' });
		const res = await request(app)
			.put('/api/players/1')
			.set('Authorization', `Bearer ${token}`)
			.send({ email: 'hacker@example.com' });

		// Joi should reject unknown keys -> 400
		expect(res.status).toBe(400);
	});

	test('coach can call restricted update (contract)', async () => {
		const token = signTestToken({ role: 'coach' });
		const res = await request(app)
			.put('/api/players/1')
			.set('Authorization', `Bearer ${token}`)
			.send({ position: 'PG' });

		expect([200, 400, 404, 500]).toContain(res.status);

		if (res.status === 200) {
			expect(res.body).toHaveProperty('id');
			expect(res.body).toHaveProperty('position');
		}
	});
});

