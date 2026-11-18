import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from './db.js';
import { createApp } from './app.js';

let server, base, db;

const api = async (path, opts = {}) => {
  const res = await fetch(base + path, {
    ...opts,
    headers: { 'content-type': 'application/json' },
    body: opts.body && JSON.stringify(opts.body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};
const swipe = (profileId, action) => api('/api/swipe', { method: 'POST', body: { profileId, action } });

// Seed facts: profile 1 (Aanya) and 3 (Meera) liked me; profile 2 (Rohan) did not.
before(async () => {
  db = openDb(':memory:');
  server = createApp(db).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

test('seeds at least 30 profiles with required fields', async () => {
  const { body } = await api('/api/feed');
  assert.ok(body.profiles.length >= 30);
  for (const k of ['id', 'name', 'age', 'photo', 'bio', 'city', 'interests']) {
    assert.ok(k in body.profiles[0], `missing ${k}`);
  }
});

test('feed never leaks who liked the user', async () => {
  const { body } = await api('/api/feed');
  const json = JSON.stringify(body);
  assert.ok(!/likesMe|likedMe|likes_me/i.test(json));
});

test('liking someone who has not liked me does not match', async () => {
  const { status, body } = await swipe(2, 'like');
  assert.equal(status, 200);
  assert.equal(body.matched, false);
  assert.equal(body.profile, undefined);
});

test('liking someone who liked me creates a match', async () => {
  const { body } = await swipe(1, 'like');
  assert.equal(body.matched, true);
  assert.equal(body.profile.name, 'Aanya');
});

test('passing someone who liked me creates no match', async () => {
  const { body } = await swipe(3, 'pass');
  assert.equal(body.matched, false);
  const { body: m } = await api('/api/matches');
  assert.ok(!m.matches.some((p) => p.id === 3));
});

test('swiped profiles never reappear in the feed', async () => {
  const { body } = await api('/api/feed');
  const ids = body.profiles.map((p) => p.id);
  for (const id of [1, 2, 3]) assert.ok(!ids.includes(id));
});

test('matches lists only mutual likes', async () => {
  const { body } = await api('/api/matches');
  assert.deepEqual(body.matches.map((p) => p.id), [1]);
});

test('swiping twice on the same profile is rejected', async () => {
  assert.equal((await swipe(1, 'pass')).status, 409);
  // and the existing match is untouched
  assert.equal((await api('/api/matches')).body.matches.length, 1);
});

test('validates input', async () => {
  assert.equal((await swipe('abc', 'like')).status, 400);
  assert.equal((await swipe(5, 'superlike')).status, 400);
  assert.equal((await swipe(9999, 'like')).status, 404);
});

test('swipes and matches persist across reopening the database', async () => {
  const { mkdtempSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const file = join(mkdtempSync(join(tmpdir(), 'coy-')), 't.db');
  const d1 = openDb(file);
  const s1 = createApp(d1).listen(0);
  await new Promise((r) => s1.once('listening', r));
  await fetch(`http://localhost:${s1.address().port}/api/swipe`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ profileId: 1, action: 'like' }),
  });
  s1.close();
  d1.close();

  const s2 = createApp(openDb(file)).listen(0);
  await new Promise((r) => s2.once('listening', r));
  const url = `http://localhost:${s2.address().port}`;
  const matches = await (await fetch(url + '/api/matches')).json();
  const feed = await (await fetch(url + '/api/feed')).json();
  s2.close();
  assert.equal(matches.matches[0].id, 1);
  assert.ok(!feed.profiles.some((p) => p.id === 1));
});
