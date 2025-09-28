const request = require('supertest');
const app = require('../index');

describe('Rate Limiting', () => {
  it('should limit excessive requests', async () => {
    for (let i = 0; i < 100; i++) {
      await request(app).get('/api/comments/test-video');
    }
    // Add assertion for rate limit response
  });
});
