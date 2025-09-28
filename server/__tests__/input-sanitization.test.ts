const request = require('supertest');
const app = require('../index');

describe('Input Sanitization', () => {
  it('should reject malicious input', async () => {
    const res = await request(app)
      .post('/api/comments')
      .send({ videoId: 'test-video', userId: 'test-user', content: '<script>alert(1)</script>' });
    expect(res.statusCode).toBe(400);
  });
});
