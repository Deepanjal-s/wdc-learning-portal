import assert from 'node:assert/strict';
import { test } from 'node:test';
import mongoose from 'mongoose';
import errorHandler from './errorHandler.js';

function run(error) {
  const out = {};
  const response = {
    status(code) { out.status = code; return this; },
    json(body) { out.body = body; return this; },
  };
  errorHandler(error, {}, response, () => {});
  return out;
}

test('a malformed id (Mongoose CastError) is a 400, not a 500', () => {
  const error = new mongoose.Error.CastError('ObjectId', 'not-an-id', '_id');
  const out = run(error);
  assert.equal(out.status, 400);
  assert.equal(out.body.message, 'One or more supplied ids are invalid.');
});

test('unexpected errors stay 500 and do not leak their message', () => {
  const out = run(new Error('db password is hunter2'));
  assert.equal(out.status, 500);
  assert.equal(out.body.message, 'Internal server error.');
});
