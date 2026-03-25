import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

router.get('/:slug', (req, res) => {
  const db = getDb();
  const { slug } = req.params;
  const { page = 1, limit = 20, source, sentiment, topic, days = 7 } = req.query;

  const city = db.prepare('SELECT id FROM cities WHERE slug = ?').get(slug);
  if (!city) return res.status(404).json({ error: 'City not found' });

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const since = new Date(Date.now() - parseInt(days) * 86400000).toISOString();

  const conditions = ['a.city_id = ?', 'a.published_at >= ?'];
  const params = [city.id, since];

  if (source && ['social', 'news', 'official'].includes(source)) {
    conditions.push('a.source_type = ?');
    params.push(source);
  }
  if (sentiment && ['positive', 'negative', 'neutral'].includes(sentiment)) {
    conditions.push('an.sentiment = ?');
    params.push(sentiment);
  }
  if (topic) {
    conditions.push('an.topics LIKE ?');
    params.push(`%${topic}%`);
  }

  const where = conditions.join(' AND ');

  const total = db.prepare(`
    SELECT COUNT(*) as cnt FROM articles a
    JOIN analysis an ON a.id = an.article_id
    WHERE ${where}
  `).get(...params).cnt;

  const items = db.prepare(`
    SELECT a.id, a.source_type, a.source_name, a.title, a.content,
           a.url, a.published_at,
           an.sentiment, an.sentiment_score, an.topics, an.summary, an.keywords
    FROM articles a
    JOIN analysis an ON a.id = an.article_id
    WHERE ${where}
    ORDER BY a.published_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset).map(r => ({
    ...r,
    topics: safeJson(r.topics, []),
    keywords: safeJson(r.keywords, []),
  }));

  res.json({
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / parseInt(limit)),
    items,
  });
});

function safeJson(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

export default router;
