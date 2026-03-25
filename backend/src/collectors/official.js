import Parser from 'rss-parser';
import logger from '../utils/logger.js';

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'CitySentiment/1.0' },
});

export async function collectOfficialContent(city) {
  if (!city.official_feeds) return [];

  const feeds = city.official_feeds.split('|').filter(Boolean);
  const articles = [];

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      const sourceName = `Comune di ${city.name}`;

      for (const item of feed.items.slice(0, 15)) {
        if (!item.link) continue;
        const content = stripHtml(item.contentSnippet || item.content || item.summary || item.title || '');
        if (!content) continue;

        articles.push({
          source_type: 'official',
          source_name: sourceName,
          source_url: feedUrl,
          title: item.title?.trim() || null,
          content: content.slice(0, 2000),
          url: item.link,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        });
      }

      logger.info(`Official [${sourceName}]: ${articles.length} items`);
    } catch (err) {
      logger.warn(`Official feed failed for ${feedUrl}: ${err.message}`);
    }
  }

  return articles;
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
