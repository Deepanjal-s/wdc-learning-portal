import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import app from './app.js';

let server;
let baseUrl;

before(async () => {
  delete process.env.MONGODB_URI;
  process.env.JWT_SECRET = 'unit-test-secret-that-is-long-enough-for-jwt-tests';
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('health endpoint reports the API is alive', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: 'ok',
    service: 'wdc-learning-portal-api',
    database: 'disconnected',
  });
});

test('ready endpoint succeeds when database configuration is optional', async () => {
  const response = await fetch(`${baseUrl}/api/health/ready`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ready', database: 'disconnected' });
});

test('unknown routes return a JSON 404 response', async () => {
  const response = await fetch(`${baseUrl}/api/not-a-route`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { message: 'Route not found.' });
});

test('invalid JSON request bodies return 400', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
    body: '{invalid',
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: 'Request body contains invalid JSON.' });
});

test('state-changing requests reject an untrusted browser origin', async () => {
  const response = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { Origin: 'https://untrusted.example' },
  });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { message: 'A trusted browser origin is required for this request.' });
});

test('registration validates required fields before database access', async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
    body: JSON.stringify({ name: 'A', email: 'not-an-email', password: 'short' }),
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: 'Name must contain at least 2 characters.' });
});

test('state-changing requests reject missing browser origin headers', async () => {
  const response = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST' });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { message: 'A trusted browser origin is required for this request.' });
});

test('admin content endpoints are protected by authentication', async () => {
  const response = await fetch(`${baseUrl}/api/admin/content`);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { message: 'Please log in to continue.' });
});
