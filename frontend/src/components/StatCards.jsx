import React from 'react';
import { TrendingUp, TrendingDown, Minus, MessageSquare, Newspaper, Building2 } from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function StatCards({ data }) {
  if (!data) return null;
  const { sentiment, sourceBreakdown } = data;
  const social = sourceBreakdown?.find(s => s.source_type === 'social')?.total || 0;
  const news = sourceBreakdown?.find(s => s.source_type === 'news')?.total || 0;
  const official = sourceBreakdown?.find(s => s.source_type === 'official')?.total || 0;
  const dom = sentiment.positive > sentiment.negative
    ? (sentiment.positive > sentiment.neutral ? 'positive' : 'neutral')
    : (sentiment.negative > sentiment.neutral ? 'negative' : 'neutral');
  const Icon = dom === 'positive' ? TrendingUp : dom === 'negative' ? TrendingDown : Minus;
  const color = dom === 'positive' ? 'bg-green-600' : dom === 'negative' ? 'bg-red-600' : 'bg-gray-600';
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard icon={Icon} label="Trend Dominante" value={dom === 'positive' ? 'Positivo' : dom === 'negative' ? 'Negativo' : 'Neutro'} sub={`${sentiment.total} analizzati`} color={color} />
      <StatCard icon={MessageSquare} label="Post Social" value={social.toLocaleString('it-IT')} sub="Twitter/X" color="bg-blue-600" />
      <StatCard icon={Newspaper} label="Articoli Stampa" value={news.toLocaleString('it-IT')} sub="RSS Feed" color="bg-purple-600" />
      <StatCard icon={Building2} label="Canali Ufficiali" value={official.toLocaleString('it-IT')} sub="Comune" color="bg-amber-600" />
    </div>
  );
}
