const request = require('supertest');
const app = require('../index');

describe('Comments API', () => {
  it('should create and fetch comments', async () => {
    const res = await request(app)
      .post('/api/comments')
      .send({ videoId: 'test-video', userId: 'test-user', content: 'Hello world!' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('username');
    const getRes = await request(app).get('/api/comments/test-video');
    expect(getRes.statusCode).toBe(200);
    expect(Array.isArray(getRes.body)).toBe(true);
  });
});
