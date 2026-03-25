import Anthropic from '@anthropic-ai/sdk';
import logger from '../utils/logger.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TOPIC_CATEGORIES = [
  'trasporti', 'viabilità', 'sanità', 'scuola', 'cultura', 'eventi',
  'sicurezza', 'ambiente', 'rifiuti', 'lavori pubblici', 'politica',
  'economia', 'turismo', 'sport', 'sociale', 'urbanistica', 'tecnologia'
];

/**
 * Analyze sentiment and extract topics from a batch of texts using Claude.
 * Returns array of analysis objects.
 */
export async function analyzeBatch(items, cityName) {
  if (!items.length) return [];

  const prompt = `Sei un analista esperto di sentiment e topic per contenuti relativi alla città di ${cityName} (Italia).

Analizza i seguenti ${items.length} testi provenienti da social media, notizie e comunicati ufficiali.

Per ogni testo restituisci un oggetto JSON con:
- "id": l'id originale del testo
- "sentiment": uno tra "positive", "negative", "neutral"
- "sentiment_score": valore da -1.0 (molto negativo) a +1.0 (molto positivo)
- "topics": array di max 3 topic tra questi: [${TOPIC_CATEGORIES.join(', ')}]
- "summary": riassunto in 1 frase (max 100 caratteri)
- "keywords": array di 3-5 parole chiave estratte

Rispondi SOLO con un array JSON valido, nessun testo extra.

TESTI DA ANALIZZARE:
${items.map(item => `{"id":${item.id},"text":${JSON.stringify(item.text.slice(0, 500))}}`).join('\n')}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].text.trim();
    const jsonStr = raw.startsWith('[') ? raw : raw.match(/\[[\s\S]*\]/)?.[0] || '[]';
    return JSON.parse(jsonStr);
  } catch (err) {
    logger.error(`Claude batch analysis failed: ${err.message}`);
    return items.map(item => ({
      id: item.id,
      sentiment: 'neutral',
      sentiment_score: 0,
      topics: [],
      summary: '',
      keywords: [],
    }));
  }
}

/**
 * Generate a city sentiment summary report using Claude.
 */
export async function generateCitySummary(cityName, stats, topTopics, recentItems) {
  const prompt = `Sei un giornalista esperto di città italiane. Basandoti sui seguenti dati di sentiment per ${cityName}, scrivi un breve report di 3-4 frasi che descrive l'umore della città e i temi principali del momento.

DATI:
- Sentiment positivo: ${stats.positive}%
- Sentiment negativo: ${stats.negative}%
- Sentiment neutro: ${stats.neutral}%
- Topic più discussi: ${topTopics.join(', ')}
- Fonti analizzate: ${stats.total} contenuti (social: ${stats.social}, notizie: ${stats.news}, ufficiali: ${stats.official})

Titoli recenti:
${recentItems.slice(0, 5).map(i => `- [${i.source_type}] ${i.title || i.content.slice(0, 80)}`).join('\n')}

Scrivi il report in italiano, in modo professionale ma accessibile.`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });
    return message.content[0].text.trim();
  } catch (err) {
    logger.error(`Claude summary failed: ${err.message}`);
    return null;
  }
}
