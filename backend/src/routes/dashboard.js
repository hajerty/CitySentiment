import { Router } from 'express';
import { getDb } from '../db/database.js';
import { generateCitySummary } from '../analyzers/claude.js';

const router = Router();

router.get('/:slug', async (req, res) => {
  try {
    const db = getDb();
    const { slug } = req.params;
    const days = Math.min(parseInt(req.query.days) || 7, 90);
    const sourceFilter = req.query.source;

    const city = db.prepare('SELECT * FROM cities WHERE slug = ?').get(slug);
    if (!city) return res.status(404).json({ error: 'City not found' });

    const since = new Date(Date.now() - days * 86400000).toISOString();

    let sourceClause = '';
    let sourceParams = [];
    if (sourceFilter && ['social', 'news', 'official'].includes(sourceFilter)) {
      sourceClause = 'AND a.source_type = ?';
      sourceParams = [sourceFilter];
    }

    const sentimentRows = db.prepare(`
      SELECT an.sentiment, COUNT(*) as count
      FROM articles a
      JOIN analysis an ON a.id = an.article_id
      WHERE a.city_id = ? AND a.published_at >= ? ${sourceClause}
      GROUP BY an.sentiment
    `).all(city.id, since, ...sourceParams);

    const sentimentMap = { positive: 0, negative: 0, neutral: 0 };
    let total = 0;
    for (const r of sentimentRows) {
      sentimentMap[r.sentiment] = r.count;
      total += r.count;
    }

    const avgScore = db.prepare(`
      SELECT AVG(an.sentiment_score) as avg_score
      FROM articles a
      JOIN analysis an ON a.id = an.article_id
      WHERE a.city_id = ? AND a.published_at >= ? ${sourceClause}
    `).get(city.id, since, ...sourceParams);

    const sentimentTimeline = db.prepare(`
      SELECT
        DATE(a.published_at) as date,
        an.sentiment,
        COUNT(*) as count,
        AVG(an.sentiment_score) as avg_score
      FROM articles a
      JOIN analysis an ON a.id = an.article_id
      WHERE a.city_id = ? AND a.published_at >= ? ${sourceClause}
      GROUP BY DATE(a.published_at), an.sentiment
      ORDER BY date ASC
    `).all(city.id, since, ...sourceParams);

    const allTopicRows = db.prepare(`
      SELECT an.topics, an.sentiment, an.sentiment_score
      FROM articles a
      JOIN analysis an ON a.id = an.article_id
      WHERE a.city_id = ? AND a.published_at >= ? ${sourceClause}
    `).all(city.id, since, ...sourceParams);

    const topicStats = {};
    for (const row of allTopicRows) {
      let topics = [];
      try { topics = JSON.parse(row.topics); } catch {}
      for (const t of topics) {
        if (!topicStats[t]) topicStats[t] = { count: 0, score_sum: 0, positive: 0, negative: 0, neutral: 0 };
        topicStats[t].count++;
        topicStats[t].score_sum += row.sentiment_score;
        topicStats[t][row.sentiment]++;
      }
    }
    const topTopics = Object.entries(topicStats)
      .map(([topic, s]) => ({
        topic,
        count: s.count,
        avg_score: parseFloat((s.score_sum / s.count).toFixed(3)),
        positive: s.positive,
        negative: s.negative,
        neutral: s.neutral,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    const topTopicNames = topTopics.slice(0, 8).map(t => t.topic);
    const topicTrends = buildTopicTrends(db, city.id, since, topTopicNames, sourceClause, sourceParams);

    const sourceBreakdown = db.prepare(`
      SELECT
        a.source_type,
        COUNT(*) as total,
        AVG(an.sentiment_score) as avg_score,
        SUM(CASE WHEN an.sentiment='positive' THEN 1 ELSE 0 END) as positive,
        SUM(CASE WHEN an.sentiment='negative' THEN 1 ELSE 0 END) as negative,
        SUM(CASE WHEN an.sentiment='neutral' THEN 1 ELSE 0 END) as neutral
      FROM articles a
      JOIN analysis an ON a.id = an.article_id
      WHERE a.city_id = ? AND a.published_at >= ?
      GROUP BY a.source_type
    `).all(city.id, since);

    const correlationData = buildSourceCorrelation(db, city.id, since, topTopicNames);

    const recentArticles = db.prepare(`
      SELECT
        a.id, a.source_type, a.source_name, a.title, a.content,
        a.url, a.published_at,
        an.sentiment, an.sentiment_score, an.topics, an.summary, an.keywords
      FROM articles a
      JOIN analysis an ON a.id = an.article_id
      WHERE a.city_id = ? AND a.published_at >= ? ${sourceClause}
      ORDER BY a.published_at DESC
      LIMIT 50
    `).all(city.id, since, ...sourceParams).map(r => ({
      ...r,
      topics: safeJson(r.topics, []),
      keywords: safeJson(r.keywords, []),
    }));

    let aiSummary = null;
    const hasApiKey = process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here';
    const useMock = process.env.USE_MOCK_DATA === 'true';

    if (hasApiKey && !useMock && total > 0) {
      const stats = {
        total,
        positive: Math.round((sentimentMap.positive / total) * 100),
        negative: Math.round((sentimentMap.negative / total) * 100),
        neutral: Math.round((sentimentMap.neutral / total) * 100),
        social: sourceBreakdown.find(s => s.source_type === 'social')?.total || 0,
        news: sourceBreakdown.find(s => s.source_type === 'news')?.total || 0,
        official: sourceBreakdown.find(s => s.source_type === 'official')?.total || 0,
      };
      try {
        aiSummary = await generateCitySummary(city.name, stats, topTopicNames, recentArticles);
      } catch {}
    }

    res.json({
      city: { id: city.id, name: city.name, slug: city.slug },
      period: { days, since },
      sentiment: {
        total,
        positive: sentimentMap.positive,
        negative: sentimentMap.negative,
        neutral: sentimentMap.neutral,
        avg_score: parseFloat((avgScore?.avg_score || 0).toFixed(3)),
      },
      sentimentTimeline: buildTimelineResponse(sentimentTimeline, days),
      topTopics,
      topicTrends,
      sourceBreakdown,
      correlationData,
      recentArticles,
      aiSummary,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

function buildTopicTrends(db, cityId, since, topicNames, sourceClause, sourceParams) {
  if (!topicNames.length) return [];
  const rows = db.prepare(`
    SELECT DATE(a.published_at) as date, an.topics, an.sentiment_score
    FROM articles a
    JOIN analysis an ON a.id = an.article_id
    WHERE a.city_id = ? AND a.published_at >= ? ${sourceClause}
    ORDER BY date ASC
  `).all(cityId, since, ...sourceParams);

  const dateTopicMap = {};
  for (const row of rows) {
    const topics = safeJson(row.topics, []);
    for (const t of topics) {
      if (!topicNames.includes(t)) continue;
      if (!dateTopicMap[row.date]) dateTopicMap[row.date] = {};
      if (!dateTopicMap[row.date][t]) dateTopicMap[row.date][t] = { count: 0 };
      dateTopicMap[row.date][t].count++;
    }
  }
  return Object.entries(dateTopicMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, topics]) => ({
      date,
      ...Object.fromEntries(Object.entries(topics).map(([t, s]) => [t, s.count])),
    }));
}

function buildSourceCorrelation(db, cityId, since, topicNames) {
  if (!topicNames.length) return [];
  const rows = db.prepare(`
    SELECT a.source_type, an.topics
    FROM articles a
    JOIN analysis an ON a.id = an.article_id
    WHERE a.city_id = ? AND a.published_at >= ?
  `).all(cityId, since);

  const matrix = {};
  for (const t of topicNames) matrix[t] = { social: 0, news: 0, official: 0 };
  for (const row of rows) {
    const topics = safeJson(row.topics, []);
    for (const t of topics) {
      if (matrix[t]) matrix[t][row.source_type]++;
    }
  }
  return topicNames.map(t => ({ topic: t, ...matrix[t] }));
}

function buildTimelineResponse(rows, days) {
  const dateSet = new Set(rows.map(r => r.date));
  const filled = [];
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
    if (dateSet.has(date)) {
      const obj = { date };
      for (const r of rows.filter(r => r.date === date)) obj[r.sentiment] = r.count;
      filled.push(obj);
    } else {
      filled.push({ date, positive: 0, negative: 0, neutral: 0 });
    }
  }
  return filled;
}

function safeJson(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

export default router;
