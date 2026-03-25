/**
 * Mock data generator for development/demo when APIs are not configured.
 * Generates realistic Italian city content.
 */

const TOPICS_BY_CATEGORY = {
  trasporti: [
    'Il piano del Comune per la nuova linea metropolitana è stato approvato in consiglio',
    'Sciopero dei mezzi pubblici previsto per venerdì prossimo, disagi attesi',
    'Nuove corsie ciclabili in centro: cittadini soddisfatti della mobilità sostenibile',
    'ATM potenzia le corse notturne nel weekend: più bus fino alle 2 di notte',
  ],
  sanità: [
    'Inaugurato il nuovo pronto soccorso pediatrico, tempi di attesa ridotti del 30%',
    'Campagna vaccinale anti-influenzale: prenotazioni aperte per over 60',
    'Ospedale Niguarda tra i migliori in Italia per cardiologia',
    "Liste di attesa troppo lunghe: comitati cittadini protestano davanti all'ASL",
  ],
  cultura: [
    'Boom di visitatori alla mostra di Klimt: già 100mila biglietti venduti',
    'Il Comune investe 2 milioni per il restauro del teatro storico',
    'Festival internazionale del cinema: svelato il programma della prossima edizione',
    'Biblioteche comunali aperte la domenica: iniziativa molto apprezzata',
  ],
  sicurezza: [
    'Nuove telecamere di sorveglianza installate in piazza centrale',
    'Operazione antidroga: sgominata rete di spaccio nei quartieri nord',
    'Residenti protestano per la sicurezza del parco, troppe risse notturne',
    'Polizia locale rafforza pattugliamento nel centro storico',
  ],
  ambiente: [
    'Piano di riforestazione urbana: 10.000 nuovi alberi entro fine anno',
    "Qualità dell'aria migliorata: PM10 sotto i limiti per terza settimana consecutiva",
    'Emergenza caldo: fontanelle pubbliche riattivate in anticipo',
    'Associazioni ambientaliste criticano il nuovo parcheggio interrato',
  ],
  lavori_pubblici: [
    'Cantiere in via Dante: modifiche alla viabilità fino a settembre',
    'Rifacimento del manto stradale in 15 quartieri cittadini',
    'Completato il restauro del ponte storico: traffico riaperto',
    'Nuovo parco giochi inaugurato nel quartiere Isola',
  ],
};

const SOCIAL_TEMPLATES = [
  'Finalmente! {topic} ❤️ #città',
  'Assurdo quello che sta succedendo con {topic} in questa città 😡',
  'Ottima notizia su {topic}, speriamo duri 🤞 #città',
  '{topic}: quando la smettono di prendere in giro i cittadini? 😤',
  'Ho sentito parlare di {topic} - qualcuno sa darmi info? 🤔',
  'Situazione {topic} veramente pessima, non si può andare avanti così',
  'Grande iniziativa sul {topic}! Finalmente qualcosa di concreto 👏',
  '{topic}: grazie al Comune per questa decisione finalmente sensata!',
];

const SOURCE_NAMES_NEWS = [
  'Corriere della Sera - Locale', 'La Repubblica - Edizione Locale',
  'Il Giorno', 'Leggo', 'TG Locale', 'Il Sole 24 Ore - Città',
];

const SOURCE_NAMES_SOCIAL = [
  '@cittadino_attivo', '@pendolare_stanco', '@mammaincittà',
  '@turista_curioso', '@giornalista_locale', '@consigliere_quartiere',
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hoursAgo(h) {
  return new Date(Date.now() - h * 3600000).toISOString();
}

export function generateMockData(cityName, count = 60) {
  const categories = Object.keys(TOPICS_BY_CATEGORY);
  const articles = [];

  for (let i = 0; i < count; i++) {
    const category = randomFrom(categories);
    const isNews = Math.random() > 0.45;
    const isOfficial = !isNews && Math.random() > 0.6;

    let article;

    if (isNews) {
      const text = randomFrom(TOPICS_BY_CATEGORY[category]);
      article = {
        source_type: 'news',
        source_name: randomFrom(SOURCE_NAMES_NEWS),
        source_url: null,
        title: text,
        content: `${text} - ${cityName}, ${new Date().toLocaleDateString('it-IT')}. Leggi l'articolo completo sul nostro sito.`,
        url: `https://example-news.it/article/${i}`,
        published_at: hoursAgo(randomInt(1, 72)),
      };
    } else if (isOfficial) {
      const text = randomFrom(TOPICS_BY_CATEGORY[category]);
      article = {
        source_type: 'official',
        source_name: `Comune di ${cityName}`,
        source_url: null,
        title: `Comunicato: ${text}`,
        content: `Il Comune di ${cityName} comunica: ${text.toLowerCase()}. Per maggiori informazioni contattare l'ufficio competente.`,
        url: `https://comune.${cityName.toLowerCase()}.it/news/${i}`,
        published_at: hoursAgo(randomInt(1, 120)),
      };
    } else {
      const topicKey = randomFrom(Object.keys(TOPICS_BY_CATEGORY));
      const topicText = topicKey.replace('_', ' ');
      const template = randomFrom(SOCIAL_TEMPLATES);
      const tweetText = template.replace('{topic}', topicText).replace('città', cityName);

      article = {
        source_type: 'social',
        source_name: randomFrom(SOURCE_NAMES_SOCIAL),
        source_url: null,
        title: null,
        content: tweetText,
        url: `https://twitter.com/example/status/${1000000 + i}`,
        published_at: hoursAgo(randomInt(0, 48)),
      };
    }

    articles.push(article);
  }

  return articles;
}

export function generateMockAnalysis(articleId, content) {
  const positiveKeywords = ['ottima', 'grande', 'finalmente', 'soddisfatti', 'apprezzata', 'grazie', 'boom', 'migliorata', 'completato'];
  const negativeKeywords = ['protesta', 'critica', 'emergenza', 'sciopero', 'disagi', 'troppo', 'pessima', 'assurdo', 'liste di attesa'];

  const lower = content.toLowerCase();
  const posScore = positiveKeywords.filter(k => lower.includes(k)).length;
  const negScore = negativeKeywords.filter(k => lower.includes(k)).length;

  let sentiment, score;
  if (posScore > negScore) {
    sentiment = 'positive';
    score = Math.min(0.9, 0.3 + posScore * 0.2);
  } else if (negScore > posScore) {
    sentiment = 'negative';
    score = Math.max(-0.9, -0.3 - negScore * 0.2);
  } else {
    sentiment = 'neutral';
    score = (Math.random() - 0.5) * 0.4;
  }

  const TOPICS_LIST = [
    'trasporti', 'sanità', 'cultura', 'sicurezza', 'ambiente',
    'lavori pubblici', 'politica', 'economia', 'sport', 'sociale',
  ];

  const topics = [];
  for (const t of TOPICS_LIST) {
    if (lower.includes(t.replace(' ', '_')) || lower.includes(t)) {
      topics.push(t);
    }
    if (topics.length >= 2) break;
  }
  if (!topics.length) topics.push(TOPICS_LIST[Math.floor(Math.random() * 5)]);

  return {
    id: articleId,
    sentiment,
    sentiment_score: parseFloat(score.toFixed(2)),
    topics,
    summary: content.slice(0, 90),
    keywords: topics.concat(sentiment),
  };
}
