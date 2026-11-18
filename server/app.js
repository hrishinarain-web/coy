import express from 'express';
import { getFeed, getMatches, getProfile, hasSwiped, recordSwipe } from './db.js';

const ACTIONS = new Set(['like', 'pass']);

/** Builds the Express app for a given db. A single logged-in user is assumed. */
export function createApp(db) {
  const app = express();
  app.use(express.json());

  app.get('/api/feed', (_req, res) => {
    res.json({ profiles: getFeed(db) });
  });

  app.post('/api/swipe', (req, res) => {
    const { profileId, action } = req.body ?? {};
    const id = Number(profileId);
    if (!Number.isInteger(id) || !ACTIONS.has(action)) {
      return res.status(400).json({ error: 'profileId (integer) and action ("like" | "pass") are required' });
    }
    const profile = getProfile(db, id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    if (hasSwiped(db, id)) return res.status(409).json({ error: 'Already swiped on this profile' });

    const { matched } = recordSwipe(db, id, action);
    // Only reveals a mutual like; a one-sided like is indistinguishable from a pass.
    res.json({ matched, profile: matched ? profile : undefined });
  });

  app.get('/api/matches', (_req, res) => {
    res.json({ matches: getMatches(db) });
  });

  // Placeholder photo: deterministic gradient + initial, so the app works offline.
  app.get('/api/photo/:id.svg', (req, res) => {
    const id = Number(req.params.id);
    const p = Number.isInteger(id) ? getProfile(db, id) : null;
    if (!p) return res.status(404).end();
    const h1 = (id * 47) % 360;
    const h2 = (h1 + 60) % 360;
    res.type('image/svg+xml').set('Cache-Control', 'public, max-age=86400').send(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560">` +
        `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0" stop-color="hsl(${h1} 70% 62%)"/><stop offset="1" stop-color="hsl(${h2} 70% 45%)"/>` +
        `</linearGradient></defs><rect width="400" height="560" fill="url(#g)"/>` +
        `<text x="200" y="300" font-family="system-ui,sans-serif" font-size="180" font-weight="700" ` +
        `fill="rgba(255,255,255,.85)" text-anchor="middle">${p.name[0]}</text></svg>`
    );
  });

  return app;
}
