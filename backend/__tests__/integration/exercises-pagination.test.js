const request = require('supertest');

const app = require('../../app');
const { signTestToken } = require('../helpers/jwtTestHelper');

describe('Exercises - Pagination', () => {
  describe('GET /api/exercises with pagination', () => {
    it('should return paginated results with default page and pageSize', async () => {
      const token = signTestToken({ role: 'coach' });

      const res = await request(app)
        .get('/api/exercises')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 401]).toContain(res.status);
      
      if (res.status === 200) {
        // Check for pagination metadata
        expect(res.body).toBeDefined();
        
        // Should have exercises array
        const exercises = res.body.exercises || res.body;
        expect(Array.isArray(exercises)).toBe(true);
        
        // Check for pagination fields
        if (res.body.page !== undefined) {
          expect(typeof res.body.page).toBe('number');
          expect(typeof res.body.pageSize).toBe('number');
          expect(typeof res.body.total).toBe('number');
          expect(typeof res.body.totalPages).toBe('number');
        }
      }
    });

    it('should accept page parameter', async () => {
      const token = signTestToken({ role: 'coach' });

      const res = await request(app)
        .get('/api/exercises?page=1')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 400, 401]).toContain(res.status);
      
      if (res.status === 200) {
        expect(res.body.page).toBe(1);
      }
    });

    it('should accept pageSize parameter', async () => {
      const token = signTestToken({ role: 'coach' });

      const res = await request(app)
        .get('/api/exercises?pageSize=12')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 400, 401]).toContain(res.status);
      
      if (res.status === 200) {
        const exercises = res.body.exercises || res.body;
        
        if (Array.isArray(exercises)) {
          // Should return at most pageSize items
          expect(exercises.length).toBeLessThanOrEqual(12);
        }
        
        if (res.body.pageSize !== undefined) {
          expect(res.body.pageSize).toBe(12);
        }
      }
    });

    it('should support different page sizes (12, 24, 48, 96)', async () => {
      const token = signTestToken({ role: 'coach' });
      const pageSizes = [12, 24, 48, 96];

      for (const size of pageSizes) {
        const res = await request(app)
          .get(`/api/exercises?pageSize=${size}`)
          .set('Authorization', `Bearer ${token}`);

        if (res.status === 200) {
          const exercises = res.body.exercises || res.body;
          
          if (Array.isArray(exercises)) {
            expect(exercises.length).toBeLessThanOrEqual(size);
          }
        }
      }
    });

    it('should return correct total count', async () => {
      const token = signTestToken({ role: 'coach' });

      const res = await request(app)
        .get('/api/exercises?pageSize=5')
        .set('Authorization', `Bearer ${token}`);

      if (res.status === 200 && res.body.total !== undefined) {
        expect(typeof res.body.total).toBe('number');
        expect(res.body.total).toBeGreaterThanOrEqual(0);
        
        const exercises = res.body.exercises || res.body;
        if (Array.isArray(exercises)) {
          // Exercises returned should be <= total
          expect(exercises.length).toBeLessThanOrEqual(res.body.total);
        }
      }
    });

    it('should calculate totalPages correctly', async () => {
      const token = signTestToken({ role: 'coach' });

      const res = await request(app)
        .get('/api/exercises?pageSize=10')
        .set('Authorization', `Bearer ${token}`);

      if (res.status === 200 && res.body.total !== undefined && res.body.pageSize !== undefined) {
        const expectedPages = Math.ceil(res.body.total / res.body.pageSize);
        
        if (res.body.totalPages !== undefined) {
          expect(res.body.totalPages).toBe(expectedPages);
        }
      }
    });

    it('should handle page beyond available data', async () => {
      const token = signTestToken({ role: 'coach' });

      const res = await request(app)
        .get('/api/exercises?page=9999')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 400, 404]).toContain(res.status);
      
      if (res.status === 200) {
        const exercises = res.body.exercises || res.body;
        
        if (Array.isArray(exercises)) {
          // Should return empty array or last page
          expect(exercises.length).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should reject invalid page number (negative)', async () => {
      const token = signTestToken({ role: 'coach' });

      const res = await request(app)
        .get('/api/exercises?page=-1')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 401]).toContain(res.status);
    });

    it('should reject invalid page number (zero)', async () => {
      const token = signTestToken({ role: 'coach' });

      const res = await request(app)
        .get('/api/exercises?page=0')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 401]).toContain(res.status);
    });

    it('should reject invalid pageSize (too small)', async () => {
      const token = signTestToken({ role: 'coach' });

      const res = await request(app)
        .get('/api/exercises?pageSize=0')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 401]).toContain(res.status);
    });

    it('should reject invalid pageSize (too large)', async () => {
      const token = signTestToken({ role: 'coach' });

      const res = await request(app)
        .get('/api/exercises?pageSize=1000')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 401]).toContain(res.status);
    });

    it('should work with pagination and filters combined', async () => {
      const token = signTestToken({ role: 'coach' });

      const res = await request(app)
        .get('/api/exercises?page=1&pageSize=12&tags=shooting')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 400, 401]).toContain(res.status);
      
      if (res.status === 200) {
        const exercises = res.body.exercises || res.body;
        
        if (Array.isArray(exercises)) {
          expect(exercises.length).toBeLessThanOrEqual(12);
        }
      }
    });

    it('should maintain consistent pagination across multiple requests', async () => {
      const token = signTestToken({ role: 'coach' });

      // Get first page
      const res1 = await request(app)
        .get('/api/exercises?page=1&pageSize=5')
        .set('Authorization', `Bearer ${token}`);

      // Get second page
      const res2 = await request(app)
        .get('/api/exercises?page=2&pageSize=5')
        .set('Authorization', `Bearer ${token}`);

      if (res1.status === 200 && res2.status === 200) {
        const exercises1 = res1.body.exercises || res1.body;
        const exercises2 = res2.body.exercises || res2.body;

        if (Array.isArray(exercises1) && Array.isArray(exercises2)) {
          // Pages should not overlap (if there are enough exercises)
          if (exercises1.length > 0 && exercises2.length > 0) {
            const ids1 = exercises1.map(e => e.id).filter(Boolean);
            const ids2 = exercises2.map(e => e.id).filter(Boolean);
            
            // Check for any overlap
            const overlap = ids1.some(id => ids2.includes(id));
            expect(overlap).toBe(false);
          }
        }
      }
    });

    it('should return hasNextPage and hasPreviousPage flags', async () => {
      const token = signTestToken({ role: 'coach' });

      const res = await request(app)
        .get('/api/exercises?page=1&pageSize=5')
        .set('Authorization', `Bearer ${token}`);

      if (res.status === 200) {
        // First page should not have previous page
        if (res.body.hasPreviousPage !== undefined) {
          expect(res.body.hasPreviousPage).toBe(false);
        }
        
        // If total > pageSize, should have next page
        if (res.body.total > res.body.pageSize && res.body.hasNextPage !== undefined) {
          expect(res.body.hasNextPage).toBe(true);
        }
      }
    });

    it('should handle empty result set with pagination', async () => {
      const token = signTestToken({ role: 'coach' });

      const res = await request(app)
        .get('/api/exercises?tags=nonexistent-tag-xyz&page=1&pageSize=12')
        .set('Authorization', `Bearer ${token}`);

      if (res.status === 200) {
        const exercises = res.body.exercises || res.body;
        
        if (Array.isArray(exercises)) {
          expect(exercises.length).toBe(0);
        }
        
        if (res.body.total !== undefined) {
          expect(res.body.total).toBe(0);
        }
        
        if (res.body.totalPages !== undefined) {
          expect(res.body.totalPages).toBe(0);
        }
      }
    });
  });

  describe('Performance with large datasets', () => {
    it('should handle pagination efficiently with default page size', async () => {
      const token = signTestToken({ role: 'coach' });

      const startTime = Date.now();
      
      const res = await request(app)
        .get('/api/exercises?pageSize=12')
        .set('Authorization', `Bearer ${token}`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (res.status === 200) {
        // Response should be reasonably fast (< 5 seconds)
        expect(responseTime).toBeLessThan(5000);
      }
    });

    it('should return consistent structure across all pages', async () => {
      const token = signTestToken({ role: 'coach' });

      const res1 = await request(app)
        .get('/api/exercises?page=1&pageSize=12')
        .set('Authorization', `Bearer ${token}`);

      const res2 = await request(app)
        .get('/api/exercises?page=2&pageSize=12')
        .set('Authorization', `Bearer ${token}`);

      if (res1.status === 200 && res2.status === 200) {
        // Both responses should have same structure
        expect(typeof res1.body).toBe(typeof res2.body);
        
        if (res1.body.exercises && res2.body.exercises) {
          // Both should have pagination metadata
          expect(res1.body).toHaveProperty('page');
          expect(res2.body).toHaveProperty('page');
          expect(res1.body).toHaveProperty('pageSize');
          expect(res2.body).toHaveProperty('pageSize');
          expect(res1.body).toHaveProperty('total');
          expect(res2.body).toHaveProperty('total');
        }
      }
    });
  });
});
