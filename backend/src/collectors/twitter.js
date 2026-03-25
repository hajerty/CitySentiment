import axios from 'axios';
import logger from '../utils/logger.js';

const TWITTER_API_BASE = 'https://api.twitter.com/2';

export async function collectTweets(city, maxResults = 50) {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token || token === 'your_twitter_bearer_token_here') {
    logger.warn('Twitter Bearer Token not configured - skipping Twitter collection');
    return [];
  }

  const query = buildQuery(city);
  try {
    const response = await axios.get(`${TWITTER_API_BASE}/tweets/search/recent`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        query,
        max_results: Math.min(maxResults, 100),
        'tweet.fields': 'created_at,text,public_metrics,lang',
        expansions: 'author_id',
        'user.fields': 'name,username',
      },
      timeout: 15000,
    });

    const tweets = response.data.data || [];
    const users = Object.fromEntries(
      (response.data.includes?.users || []).map(u => [u.id, u])
    );

    return tweets
      .filter(t => t.lang === 'it' || t.lang === 'en')
      .map(tweet => {
        const user = users[tweet.author_id] || {};
        return {
          source_type: 'social',
          source_name: `@${user.username || 'twitter'}`,
          source_url: `https://twitter.com/i/web/status/${tweet.id}`,
          title: null,
          content: tweet.text,
          url: `https://twitter.com/i/web/status/${tweet.id}`,
          published_at: new Date(tweet.created_at).toISOString(),
        };
      });
  } catch (err) {
    if (err.response?.status === 429) {
      logger.warn('Twitter API rate limit reached');
    } else {
      logger.warn(`Twitter collection failed: ${err.message}`);
    }
    return [];
  }
}

function buildQuery(city) {
  const keywords = city.keywords.split(',').map(k => k.trim());
  const parts = keywords.map(k => (k.startsWith('#') ? k : `"${k}"`) );
  return `(${parts.join(' OR ')}) -is:retweet lang:it`;
}
