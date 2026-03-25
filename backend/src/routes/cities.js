import { Router } from 'express';
import { getDb } from '../db/database.js';
import { ingestCity } from '../services/ingestion.js';
import logger from '../utils/logger.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const cities = db.prepare('SELECT id, name, slug, country FROM cities ORDER BY name').all();
  res.json(cities);
});

router.post('/:slug/ingest', async (req, res) => {
  try {
    const result = await ingestCity(req.params.slug);
    res.json({ success: true, ...result });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
