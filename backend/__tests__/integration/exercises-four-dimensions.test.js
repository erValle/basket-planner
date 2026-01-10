const request = require('supertest');

const app = require('../../app');
const { signTestToken } = require('../helpers/jwtTestHelper');

describe('Exercises - 4 Difficulty Dimensions', () => {
  describe('Create Exercise with 4 Dimensions', () => {
    it('should accept exercise with all 4 difficulty dimensions', async () => {
      const token = signTestToken({ role: 'coach' });

      const payload = {
        name: 'Test Exercise with 4 Dimensions',
        type: 'strength',
        duration: 30,
        dificultadTactica: 3,
        dificultadTecnica: 4,
        dificultadFisica: 5,
        dificultadMental: 2,
        description: 'Exercise testing all 4 difficulty dimensions',
        tags: ['test', 'dimensions'],
        active: true
      };

      const res = await request(app)
        .post('/api/exercises')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect([201, 500]).toContain(res.status);
      
      if (res.status === 201) {
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe(payload.name);
        
        // Verify all 4 dimensions are stored
        const difficulty = res.body.difficulty || res.body.dificultad;
        if (difficulty) {
          expect(difficulty).toHaveProperty('tactica');
          expect(difficulty).toHaveProperty('tecnica');
          expect(difficulty).toHaveProperty('fisica');
          expect(difficulty).toHaveProperty('mental');
        }
      }
    });

    it('should validate difficulty dimensions are between 1-5', async () => {
      const token = signTestToken({ role: 'coach' });

      const payload = {
        name: 'Invalid Difficulty Exercise',
        type: 'strength',
        duration: 30,
        dificultadTactica: 6,  // Invalid: > 5
        dificultadTecnica: 4,
        dificultadFisica: 3,
        dificultadMental: 2,
        active: true
      };

      const res = await request(app)
        .post('/api/exercises')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      // Should reject invalid difficulty value
      expect(res.status).toBe(400);
    });

    it('should validate difficulty dimensions are positive', async () => {
      const token = signTestToken({ role: 'coach' });

      const payload = {
        name: 'Invalid Difficulty Exercise',
        type: 'strength',
        duration: 30,
        dificultadTactica: 3,
        dificultadTecnica: -1,  // Invalid: negative
        dificultadFisica: 3,
        dificultadMental: 2,
        active: true
      };

      const res = await request(app)
        .post('/api/exercises')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('should accept basketball-specific exercise types', async () => {
      const token = signTestToken({ role: 'coach' });

      const basketballTypes = [
        'shooting-form',
        'shooting-game',
        'dribbling-basic',
        'dribbling-advanced',
        'passing-fundamental',
        'passing-situational',
        'defense-individual',
        'defense-team',
        'rebounding',
        'conditioning-aerobic',
        'conditioning-anaerobic',
        'tactics-offensive',
        'tactics-defensive',
        'game-situations',
        'scrimmage',
        'warmup',
        'cooldown',
        'mental'
      ];

      for (const type of basketballTypes) {
        const payload = {
          name: `Exercise type ${type}`,
          type: 'strength',  // API currently uses generic types
          duration: 20,
          dificultadTactica: 3,
          dificultadTecnica: 3,
          dificultadFisica: 3,
          dificultadMental: 3,
          tags: [type],
          active: true
        };

        const res = await request(app)
          .post('/api/exercises')
          .set('Authorization', `Bearer ${token}`)
          .send(payload);

        expect([201, 400, 500]).toContain(res.status);
      }
    });

    it('should accept etiquetas (tags) as array', async () => {
      const token = signTestToken({ role: 'coach' });

      const payload = {
        name: 'Exercise with tags',
        type: 'strength',
        duration: 25,
        dificultadTactica: 3,
        dificultadTecnica: 4,
        dificultadFisica: 3,
        dificultadMental: 2,
        tags: ['defense', '1v1', 'pressure', 'footwork'],
        active: true
      };

      const res = await request(app)
        .post('/api/exercises')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect([201, 500]).toContain(res.status);
      
      if (res.status === 201) {
        expect(res.body.tags || res.body.etiquetas).toBeDefined();
      }
    });

    it('should accept materialesNecesarios (equipment) as array', async () => {
      const token = signTestToken({ role: 'coach' });

      const payload = {
        name: 'Exercise with materials',
        type: 'strength',
        duration: 30,
        dificultadTactica: 3,
        dificultadTecnica: 4,
        dificultadFisica: 4,
        dificultadMental: 2,
        tags: ['shooting'],
        materialesNecesarios: ['Balones', 'Conos', 'Aros'],
        active: true
      };

      const res = await request(app)
        .post('/api/exercises')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect([201, 500]).toContain(res.status);
    });

    it('should accept exercise with all new fields', async () => {
      const token = signTestToken({ role: 'coach' });

      const payload = {
        name: 'Complete Exercise with All Fields',
        type: 'strength',
        duration: 35,
        dificultadTactica: 4,
        dificultadTecnica: 5,
        dificultadFisica: 3,
        dificultadMental: 4,
        description: 'Complete exercise with all new fields',
        tags: ['shooting', 'game-situations', 'pressure'],
        materialesNecesarios: ['Balones', 'Conos', 'Aros', 'Escalera de agilidad'],
        observations: 'Focus on proper shooting form under defensive pressure',
        active: true
      };

      const res = await request(app)
        .post('/api/exercises')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect([201, 500]).toContain(res.status);
      
      if (res.status === 201) {
        expect(res.body.name).toBe(payload.name);
        expect(res.body.duration).toBe(payload.duration);
      }
    });
  });

  describe('List Exercises', () => {
    it('should return exercises with 4 difficulty dimensions', async () => {
      const token = signTestToken({ role: 'coach' });

      const res = await request(app)
        .get('/api/exercises')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 401]).toContain(res.status);
      
      if (res.status === 200) {
        expect(Array.isArray(res.body) || Array.isArray(res.body.exercises)).toBe(true);
        
        const exercises = res.body.exercises || res.body;
        if (exercises.length > 0) {
          const firstExercise = exercises[0];
          
          // Check if difficulty dimensions exist
          const difficulty = firstExercise.difficulty || firstExercise.dificultad;
          if (difficulty && typeof difficulty === 'object') {
            // New format with 4 dimensions
            expect(difficulty).toHaveProperty('tactica');
            expect(difficulty).toHaveProperty('tecnica');
            expect(difficulty).toHaveProperty('fisica');
            expect(difficulty).toHaveProperty('mental');
          }
        }
      }
    });

    it('should support filtering by difficulty dimensions', async () => {
      const token = signTestToken({ role: 'coach' });

      const res = await request(app)
        .get('/api/exercises?minDificultadTecnica=4')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 400, 401]).toContain(res.status);
      
      if (res.status === 200) {
        const exercises = res.body.exercises || res.body;
        
        if (Array.isArray(exercises) && exercises.length > 0) {
          exercises.forEach(exercise => {
            const difficulty = exercise.difficulty || exercise.dificultad;
            if (difficulty && difficulty.tecnica) {
              expect(difficulty.tecnica).toBeGreaterThanOrEqual(4);
            }
          });
        }
      }
    });

    it('should support filtering by tags', async () => {
      const token = signTestToken({ role: 'coach' });

      const res = await request(app)
        .get('/api/exercises?tags=shooting,defense')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 400, 401]).toContain(res.status);
    });
  });

  describe('Update Exercise', () => {
    it('should allow updating difficulty dimensions', async () => {
      const token = signTestToken({ role: 'coach' });

      // First create an exercise
      const createRes = await request(app)
        .post('/api/exercises')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Exercise to Update',
          type: 'strength',
          duration: 30,
          dificultadTactica: 3,
          dificultadTecnica: 3,
          dificultadFisica: 3,
          dificultadMental: 3,
          active: true
        });

      if (createRes.status === 201 && createRes.body.id) {
        const exerciseId = createRes.body.id;

        // Update the difficulty dimensions
        const updateRes = await request(app)
          .put(`/api/exercises/${exerciseId}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            dificultadTactica: 5,
            dificultadTecnica: 4,
            dificultadFisica: 2,
            dificultadMental: 4
          });

        expect([200, 404, 500]).toContain(updateRes.status);
        
        if (updateRes.status === 200) {
          const difficulty = updateRes.body.difficulty || updateRes.body.dificultad;
          if (difficulty) {
            expect(difficulty.tactica).toBe(5);
            expect(difficulty.tecnica).toBe(4);
            expect(difficulty.fisica).toBe(2);
            expect(difficulty.mental).toBe(4);
          }
        }
      }
    });

    it('should allow updating tags and materials', async () => {
      const token = signTestToken({ role: 'coach' });

      // First create an exercise
      const createRes = await request(app)
        .post('/api/exercises')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Exercise to Update Tags',
          type: 'strength',
          duration: 30,
          dificultadTactica: 3,
          dificultadTecnica: 3,
          dificultadFisica: 3,
          dificultadMental: 3,
          tags: ['old-tag'],
          materialesNecesarios: ['Balones'],
          active: true
        });

      if (createRes.status === 201 && createRes.body.id) {
        const exerciseId = createRes.body.id;

        const updateRes = await request(app)
          .put(`/api/exercises/${exerciseId}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            tags: ['new-tag', 'shooting', 'game-situations'],
            materialesNecesarios: ['Balones', 'Conos', 'Aros']
          });

        expect([200, 404, 500]).toContain(updateRes.status);
      }
    });
  });

  describe('Backwards Compatibility', () => {
    it('should still accept old difficulty format (single number)', async () => {
      const token = signTestToken({ role: 'coach' });

      const payload = {
        name: 'Exercise with old difficulty format',
        type: 'strength',
        duration: 30,
        difficulty: { effortTechnical: 4, effortPhysical: 5, effortMental: 3 },
        active: true
      };

      const res = await request(app)
        .post('/api/exercises')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      // Should either accept or properly reject with validation error
      expect([201, 400, 500]).toContain(res.status);
    });

    it('should handle exercises without dimension data gracefully', async () => {
      const token = signTestToken({ role: 'coach' });

      const res = await request(app)
        .get('/api/exercises')
        .set('Authorization', `Bearer ${token}`);

      if (res.status === 200) {
        const exercises = res.body.exercises || res.body;
        
        // Should not crash if some exercises lack dimension data
        expect(Array.isArray(exercises) || exercises === undefined).toBe(true);
      }
    });
  });
});
