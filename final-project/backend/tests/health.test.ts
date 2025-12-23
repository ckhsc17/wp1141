import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

// Create a minimal test app
const app = express();
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

describe('Health Check', () => {
  it('should return 200 OK', async () => {
    const response = await request(app).get('/healthz');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should return JSON content type', async () => {
    const response = await request(app).get('/healthz');
    
    expect(response.headers['content-type']).toMatch(/json/);
  });
});


