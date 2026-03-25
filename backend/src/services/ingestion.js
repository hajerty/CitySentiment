import { getDb } from '../db/database.js';
import { collectRssArticles } from '../collectors/rss.js';
import { collectTweets } from '../collectors/twitter.js';
import { collectOfficialContent } from '../collectors/official.js';
import { generateMockData, generateMockAnalysis } from '../collectors/mock.js';
import { analyzeBatch } from '../analyzers/claude.js';
import logger from '../utils/logger.js';

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';
const BATCH_SIZE = 10;

export async function ingestCity(citySlug) {
  const db = getDb();
  const city = db.prepare('SELECT * FROM cities WHERE slug = ?').get(citySlug);
  if (!city) throw new Error(`City not found: ${citySlug}`);

  logger.info(`Starting ingestion for ${city.name}...`);

  let articles;
  if (USE_MOCK || !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
    logger.info('Using mock data (set ANTHROPIC_API_KEY and USE_MOCK_DATA=false for real data)');
    articles = generateMockData(city.name, 60);
  } else {
    const [rss, tweets, official] = await Promise.allSettled([
      collectRssArticles(city),
      collectTweets(city),
      collectOfficialContent(city),
    ]);

    articles = [
      ...(rss.status === 'fulfilled' ? rss.value : []),
      ...(tweets.status === 'fulfilled' ? tweets.value : []),
      ...(official.status === 'fulfilled' ? official.value : []),
    ];
  }

  const insertArticle = db.prepare(`
    INSERT OR IGNORE INTO articles (city_id, source_type, source_name, source_url, title, content, url, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertedIds = [];
  const insertMany = db.transaction((arts) => {
    for (const a of arts) {
      const url = a.url || `generated-${Date.now()}-${Math.random()}`;
      const result = insertArticle.run(
        city.id, a.source_type, a.source_name, a.source_url,
        a.title, a.content, url, a.published_at
      );
      if (result.changes > 0) insertedIds.push(result.lastInsertRowid);
    }
  });
  insertMany(articles);

  logger.info(`Inserted ${insertedIds.length} new articles for ${city.name}`);

  if (!insertedIds.length) return { inserted: 0, analyzed: 0 };

  const toAnalyze = db.prepare(
    `SELECT id, content FROM articles WHERE id IN (${insertedIds.join(',')}) AND id NOT IN (SELECT article_id FROM analysis)`
  ).all();

  const insertAnalysis = db.prepare(`
    INSERT OR IGNORE INTO analysis (article_id, sentiment, sentiment_score, topics, summary, keywords)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let analyzed = 0;
  for (let i = 0; i < toAnalyze.length; i += BATCH_SIZE) {
    const batch = toAnalyze.slice(i, i + BATCH_SIZE);
    const items = batch.map(a => ({ id: a.id, text: a.content }));

    let results;
    if (USE_MOCK || !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
      results = items.map(item => generateMockAnalysis(item.id, item.text));
    } else {
      results = await analyzeBatch(items, city.name);
    }

    const insertBatch = db.transaction((res) => {
      for (const r of res) {
        insertAnalysis.run(
          r.id, r.sentiment, r.sentiment_score,
          JSON.stringify(r.topics || []),
          r.summary || '',
          JSON.stringify(r.keywords || [])
        );
        analyzed++;
      }
    });
    insertBatch(results);

    logger.info(`Analyzed batch ${i / BATCH_SIZE + 1}: ${batch.length} items`);
  }

  logger.info(`Ingestion complete for ${city.name}: ${insertedIds.length} inserted, ${analyzed} analyzed`);
  return { inserted: insertedIds.length, analyzed };
}
