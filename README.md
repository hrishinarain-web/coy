# Coy: Discover tab

A swipe-based "Discover" tab (Part B of the Coy SDE Intern Assignment) built as a standalone app.
Tab bar has a blank **Home** tab and the **Discover** tab, which has a **Swipe** view and a **Matches** view.

## Run it

Requires Node 22.13+ (uses the built-in `node:sqlite`, so there are no native dependencies).

```bash
cd client && npm install && npm run build && cd ..
cd server && npm install && npm start
```

Open http://localhost:3001 (best in a mobile viewport). The database `server/coy.db` is created and seeded on first run; delete it to reset.

Dev mode with hot reload: run `npm start` in `server/` and `npm run dev` in `client/` (Vite proxies `/api` to port 3001).

```bash
cd server && npm test
```

## Stack

- **Frontend:** React + Vite, mobile-first. Drag gestures use pointer events (touch + mouse), with Like/Pass buttons and ←/→ keys on desktop.
- **Backend:** Node + Express 5.
- **Data:** SQLite (`node:sqlite`).

## API

| Endpoint | Behaviour |
| --- | --- |
| `GET /api/feed` | Profiles I have not swiped on. |
| `POST /api/swipe` `{ profileId, action: "like" \| "pass" }` | Records the swipe, returns `{ matched, profile? }`. `409` if already swiped, `400` bad input, `404` unknown profile. |
| `GET /api/matches` | Mutual likes only, newest first. |

## Design decisions

- **Privacy is the core promise.** Seeded "already liked you" data lives in the `swipes` table as rows targeting `me`. No endpoint selects it. `/feed` carries no "likes you" field, and a one-sided like returns the same response shape as a pass (`matched: false`), so the API cannot be used to probe who liked you. A test asserts this.
- **One swipes table.** Matches are *derived* (my like + their like), not stored, so they cannot go out of sync with swipes.
- **Never reappear:** the feed query excludes anything I've swiped on, and the `(swiper, target)` primary key plus the `409` makes a double swipe impossible even with concurrent requests.
- **Match check is atomic:** inserting the swipe and checking for the reverse like happen in one transaction.
- **Placeholder photos** are generated SVGs served from `/api/photo/:id.svg`, so the app works offline.
- **Seed data:** 32 profiles, 10 of which have already liked you (Aanya, Meera, Ishita, Vihaan, Kiara, Tara, Navya, Pari, Alia, Ira). Like any of those to see "It's a match!".

## Layout

```
server/   db.js (schema, queries) · app.js (routes) · seedData.js · app.test.js
client/   src/Discover.jsx · SwipeCard.jsx · Matches.jsx · api.js
PART_A.md Part A write-up (feature suggestions)
```
