// tests/auth.test.js
// Simple smoke test for health endpoint

const request = require('supertest');
const app = require('../src/app');

describe('Health endpoint', () => {
  it('should return ok: true', async () => {
    const res = await request(app).get('/health').expect(200);

    expect(res.body).toHaveProperty('ok', true);
    expect(typeof res.body.ts).toBe('number');
  });
});
