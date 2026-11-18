import { DatabaseSync } from 'node:sqlite';
import { SEED_PROFILES } from './seedData.js';

export const ME = 'me';

const SCHEMA = [
  'PRAGMA journal_mode = WAL',
  `CREATE TABLE IF NOT EXISTS profiles (
     id        INTEGER PRIMARY KEY,
     name      TEXT NOT NULL,
     age       INTEGER NOT NULL,
     bio       TEXT NOT NULL,
     city      TEXT NOT NULL,
     interests TEXT NOT NULL            -- JSON array
   )`,
  // Every like/pass by anyone. The logged-in user is the literal 'me'.
  `CREATE TABLE IF NOT EXISTS swipes (
     swiper_id  TEXT NOT NULL,
     target_id  TEXT NOT NULL,
     action     TEXT NOT NULL CHECK (action IN ('like','pass')),
     created_at INTEGER NOT NULL,
     PRIMARY KEY (swiper_id, target_id)
   )`,
];

/** Runs fn inside a transaction; rolls back if it throws. */
function transaction(db, fn) {
  db.prepare('BEGIN IMMEDIATE').run();
  try {
    const result = fn();
    db.prepare('COMMIT').run();
    return result;
  } catch (e) {
    db.prepare('ROLLBACK').run();
    throw e;
  }
}

/** Opens (or creates) the database and ensures schema + seed data exist. */
export function openDb(file = ':memory:') {
  const db = new DatabaseSync(file);
  for (const stmt of SCHEMA) db.prepare(stmt).run();
  seedIfEmpty(db);
  return db;
}

function seedIfEmpty(db) {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM profiles').get();
  if (n > 0) return;
  const insProfile = db.prepare(
    'INSERT INTO profiles (id, name, age, bio, city, interests) VALUES (?,?,?,?,?,?)'
  );
  const insLike = db.prepare(
    "INSERT INTO swipes (swiper_id, target_id, action, created_at) VALUES (?, ?, 'like', ?)"
  );
  transaction(db, () => {
    SEED_PROFILES.forEach((p, i) => {
      const id = i + 1;
      insProfile.run(id, p.name, p.age, p.bio, p.city, JSON.stringify(p.interests));
      // Seeded "already liked you" profiles. Stored as swipes aimed at ME, never exposed by the API.
      if (p.likesMe) insLike.run(String(id), ME, Date.now());
    });
  });
}

const toPublic = (row) => ({
  id: row.id,
  name: row.name,
  age: row.age,
  bio: row.bio,
  city: row.city,
  interests: JSON.parse(row.interests),
  photo: `/api/photo/${row.id}.svg`,
});

/** Profiles I have not swiped on yet. Deliberately selects no "likes me" information. */
export function getFeed(db) {
  const rows = db
    .prepare(
      `SELECT p.* FROM profiles p
       WHERE NOT EXISTS (
         SELECT 1 FROM swipes s WHERE s.swiper_id = ? AND s.target_id = CAST(p.id AS TEXT)
       )
       ORDER BY p.id`
    )
    .all(ME);
  return rows.map(toPublic);
}

export function getProfile(db, id) {
  const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id);
  return row ? toPublic(row) : null;
}

export function hasSwiped(db, id) {
  return !!db
    .prepare('SELECT 1 FROM swipes WHERE swiper_id = ? AND target_id = ?')
    .get(ME, String(id));
}

/**
 * Records my swipe. Returns { matched }. A match exists only if they have liked me
 * and I like them. Recording + match check run in one transaction.
 */
export function recordSwipe(db, id, action) {
  return transaction(db, () => {
    db.prepare(
      'INSERT INTO swipes (swiper_id, target_id, action, created_at) VALUES (?,?,?,?)'
    ).run(ME, String(id), action, Date.now());
    const matched =
      action === 'like' &&
      !!db
        .prepare(
          "SELECT 1 FROM swipes WHERE swiper_id = ? AND target_id = ? AND action = 'like'"
        )
        .get(String(id), ME);
    return { matched };
  });
}

/** Mutual likes only, newest first. */
export function getMatches(db) {
  const rows = db
    .prepare(
      `SELECT p.*, mine.created_at AS matched_at
       FROM swipes mine
       JOIN swipes theirs
         ON theirs.swiper_id = mine.target_id AND theirs.target_id = mine.swiper_id
       JOIN profiles p ON CAST(p.id AS TEXT) = mine.target_id
       WHERE mine.swiper_id = ? AND mine.action = 'like' AND theirs.action = 'like'
       ORDER BY mine.created_at DESC`
    )
    .all(ME);
  return rows.map((r) => ({ ...toPublic(r), matchedAt: r.matched_at }));
}
