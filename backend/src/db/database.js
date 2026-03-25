import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/citysentiment.db');

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
    logger.info(`Database initialized at ${DB_PATH}`);
  }
  return db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      country TEXT DEFAULT 'IT',
      keywords TEXT NOT NULL,
      rss_feeds TEXT,
      official_feeds TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_id INTEGER NOT NULL REFERENCES cities(id),
      source_type TEXT NOT NULL CHECK(source_type IN ('social','news','official')),
      source_name TEXT NOT NULL,
      source_url TEXT,
      content TEXT NOT NULL,
      title TEXT,
      url TEXT,
      published_at DATETIME NOT NULL,
      collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(url, city_id)
    );

    CREATE TABLE IF NOT EXISTS analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      sentiment TEXT NOT NULL CHECK(sentiment IN ('positive','negative','neutral')),
      sentiment_score REAL NOT NULL DEFAULT 0,
      topics TEXT NOT NULL,
      summary TEXT,
      keywords TEXT,
      analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_articles_city_date ON articles(city_id, published_at);
    CREATE INDEX IF NOT EXISTS idx_articles_source_type ON articles(source_type);
    CREATE INDEX IF NOT EXISTS idx_analysis_sentiment ON analysis(sentiment);

    -- Default cities
    INSERT OR IGNORE INTO cities (name, slug, keywords, rss_feeds, official_feeds)
    VALUES
      ('Milano', 'milano', 'Milano,Milan,#Milano,#Milan',
       'https://www.corriere.it/rss/milano.xml|https://milano.repubblica.it/rss/|https://www.ilgiorno.it/rss/milano',
       'https://www.comune.milano.it/rss'),
      ('Roma', 'roma', 'Roma,Rome,#Roma,#Rome',
       'https://roma.corriere.it/rss/|https://roma.repubblica.it/rss/',
       'https://www.comune.roma.it/rss'),
      ('Torino', 'torino', 'Torino,Turin,#Torino,#Turin',
       'https://www.lastampa.it/rss/torino.xml',
       'https://www.comune.torino.it/rss'),
      ('Napoli', 'napoli', 'Napoli,Naples,#Napoli',
       'https://napoli.repubblica.it/rss/',
       NULL),
      ('Firenze', 'firenze', 'Firenze,Florence,#Firenze',
       'https://firenze.repubblica.it/rss/',
       NULL);
  `);
}
