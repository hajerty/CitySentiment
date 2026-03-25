import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cron from 'node-cron';

import { getDb } from './db/database.js';
import { ingestCity } from './services/ingestion.js';
import citiesRouter from './routes/cities.js';
import dashboardRouter from './routes/dashboard.js';
import articlesRouter from './routes/articles.js';
import logger from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/cities', citiesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/articles', articlesRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function initialIngest() {
  const db = getDb();
  const cities = db.prepare('SELECT slug FROM cities').all();
  for (const city of cities) {
    try {
      await ingestCity(city.slug);
    } catch (err) {
      logger.error(`Initial ingest failed for ${city.slug}: ${err.message}`);
    }
  }
}

const intervalMinutes = parseInt(process.env.REFRESH_INTERVAL_MINUTES) || 30;
cron.schedule(`*/${intervalMinutes} * * * *`, async () => {
  logger.info('Scheduled ingestion starting...');
  const db = getDb();
  const cities = db.prepare('SELECT slug FROM cities').all();
  for (const city of cities) {
    try {
      await ingestCity(city.slug);
    } catch (err) {
      logger.error(`Scheduled ingest failed for ${city.slug}: ${err.message}`);
    }
  }
});

app.listen(PORT, async () => {
  logger.info(`CitySentiment backend running on http://localhost:${PORT}`);
  await initialIngest();
});
