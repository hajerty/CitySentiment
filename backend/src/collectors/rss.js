import Parser from 'rss-parser';
import logger from '../utils/logger.js';

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'CitySentiment/1.0 RSS Reader' },
});

export async function collectRssArticles(city) {
  if (!city.rss_feeds) return [];

  const feeds = city.rss_feeds.split('|').filter(Boolean);
  const articles = [];

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      const sourceName = feed.title || new URL(feedUrl).hostname;

      for (const item of feed.items.slice(0, 20)) {
        if (!item.link) continue;

        const content = stripHtml(item.contentSnippet || item.content || item.summary || item.title || '');
        if (!content) continue;

        const keywords = city.keywords.toLowerCase().split(',');
        const searchText = `${item.title || ''} ${content}`.toLowerCase();
        if (!keywords.some(kw => searchText.includes(kw.trim()))) continue;

        articles.push({
          source_type: 'news',
          source_name: sourceName,
          source_url: feedUrl,
          title: item.title?.trim() || null,
          content: content.slice(0, 2000),
          url: item.link,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        });
      }

      logger.info(`RSS [${sourceName}]: ${articles.length} items collected`);
    } catch (err) {
      logger.warn(`RSS fetch failed for ${feedUrl}: ${err.message}`);
    }
  }

  return articles;
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
