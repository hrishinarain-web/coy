import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { openDb } from './db.js';
import { createApp } from './app.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const db = openDb(process.env.DB_FILE ?? path.join(here, 'coy.db'));
const app = createApp(db);

// Serve the built client if present (npm run build in /client).
const dist = path.join(here, '..', 'client', 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const port = process.env.PORT ?? 3001;
app.listen(port, () => console.log(`Coy Discover API on http://localhost:${port}`));
