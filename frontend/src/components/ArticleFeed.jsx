import React, { useState } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

const SOURCE_CONFIG = {
  social: { label: 'Social', cls: 'badge-social', icon: '🐦' },
  news: { label: 'Notizie', cls: 'badge-news', icon: '📰' },
  official: { label: 'Ufficiale', cls: 'badge-official', icon: '🏗️' },
};
const SENTIMENT_CONFIG = {
  positive: { cls: 'badge-positive', label: 'Positivo', dot: 'bg-green-500' },
  negative: { cls: 'badge-negative', label: 'Negativo', dot: 'bg-red-500' },
  neutral: { cls: 'badge-neutral', label: 'Neutro', dot: 'bg-gray-500' },
};

function ArticleCard({ article }) {
  const [expanded, setExpanded] = useState(false);
  const src = SOURCE_CONFIG[article.source_type] || SOURCE_CONFIG.news;
  const snt = SENTIMENT_CONFIG[article.sentiment] || SENTIMENT_CONFIG.neutral;
  const timeAgo = (() => { try { return formatDistanceToNow(parseISO(article.published_at), { addSuffix: true, locale: it }); } catch { return ''; } })();
  const displayText = article.summary || article.content;
  const isLong = displayText?.length > 120;
  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-3 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`badge ${src.cls}`}>{src.icon} {src.label}</span>
          <span className={`badge ${snt.cls}`}><span className={`w-1.5 h-1.5 rounded-full ${snt.dot} mr-1`} />{snt.label}</span>
          {article.sentiment_score !== undefined && <span className="text-xs font-mono text-gray-500">{article.sentiment_score > 0 ? '+' : ''}{article.sentiment_score.toFixed(2)}</span>}
        </div>
        <span className="text-xs text-gray-600 flex-shrink-0">{timeAgo}</span>
      </div>
      {article.title && <p className="text-sm font-medium text-gray-200 mb-1 line-clamp-2">{article.title}</p>}
      <p className={`text-xs text-gray-400 leading-relaxed ${!expanded && isLong ? 'line-clamp-2' : ''}`}>{displayText}</p>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">{article.source_name}</span>
          {article.topics?.length > 0 && (
            <div className="flex gap-1">
              {article.topics.slice(0, 2).map(t => <span key={t} className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded capitalize">{t}</span>)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isLong && <button onClick={() => setExpanded(!expanded)} className="text-gray-600 hover:text-gray-400 transition-colors">{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>}
          {article.url && !article.url.startsWith('generated') && <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-400 transition-colors"><ExternalLink size={13} /></a>}
        </div>
      </div>
    </div>
  );
}

export default function ArticleFeed({ articles }) {
  const [filter, setFilter] = useState('all');
  const [sentiment, setSentiment] = useState('all');
  const filtered = (articles || []).filter(a => {
    if (filter !== 'all' && a.source_type !== filter) return false;
    if (sentiment !== 'all' && a.sentiment !== sentiment) return false;
    return true;
  });
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="card-title mb-0">Feed Contenuti</div>
        <span className="text-xs text-gray-500">{filtered.length} elementi</span>
      </div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {['all','social','news','official'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filter === s ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
            {s === 'all' ? 'Tutte le fonti' : s === 'social' ? '🐦 Social' : s === 'news' ? '📰 Notizie' : '🏗️ Ufficiale'}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all','positive','negative','neutral'].map(s => (
          <button key={s} onClick={() => setSentiment(s)} className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${sentiment === s ? 'bg-gray-700 border-gray-500 text-white' : 'border-gray-800 text-gray-500 hover:border-gray-700'}`}>
            {s === 'all' ? 'Tutti' : s === 'positive' ? '😊 Pos' : s === 'negative' ? '😠 Neg' : '😐 Neu'}
          </button>
        ))}
      </div>
      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        {filtered.length === 0
          ? <p className="text-sm text-gray-500 text-center py-8">Nessun contenuto trovato</p>
          : filtered.map(a => <ArticleCard key={a.id} article={a} />)}
      </div>
    </div>
  );
}
