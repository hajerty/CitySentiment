import React from 'react';

const SOURCE_LABELS = { social: 'Social', news: 'Notizie', official: 'Ufficiale' };
const SOURCE_ICONS = { social: '🐦', news: '📰', official: '🏗️' };
const SOURCE_COLORS = { social: '#3b82f6', news: '#8b5cf6', official: '#f59e0b' };

export default function SourceBreakdown({ data }) {
  if (!data?.length) return null;
  return (
    <div className="card">
      <div className="card-title">Breakdown per Fonte</div>
      <div className="grid grid-cols-3 gap-3">
        {['social', 'news', 'official'].map(type => {
          const src = data.find(d => d.source_type === type);
          if (!src) return (
            <div key={type} className="bg-gray-800 rounded-lg p-3 text-center opacity-40">
              <div className="text-2xl mb-1">{SOURCE_ICONS[type]}</div>
              <div className="text-xs text-gray-500">{SOURCE_LABELS[type]}</div>
              <div className="text-xs text-gray-600 mt-1">No data</div>
            </div>
          );
          const total = src.total || 0;
          const posP = total > 0 ? Math.round((src.positive / total) * 100) : 0;
          const negP = total > 0 ? Math.round((src.negative / total) * 100) : 0;
          const neuP = 100 - posP - negP;
          const score = parseFloat((src.avg_score || 0).toFixed(2));
          return (
            <div key={type} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50" style={{ borderTopColor: SOURCE_COLORS[type], borderTopWidth: 2 }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{SOURCE_ICONS[type]}</span>
                <span className="text-xs font-semibold text-gray-300">{SOURCE_LABELS[type]}</span>
              </div>
              <div className="text-2xl font-bold text-white">{total.toLocaleString('it-IT')}</div>
              <div className="text-xs text-gray-500 mb-2">contenuti</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-green-400">Pos {posP}%</span>
                  <span className="text-red-400">Neg {negP}%</span>
                  <span className="text-gray-500">Neu {neuP}%</span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden flex">
                  <div className="bg-green-500" style={{ width: `${posP}%` }} />
                  <div className="bg-red-500" style={{ width: `${negP}%` }} />
                  <div className="bg-gray-600" style={{ width: `${neuP}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${score >= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.round(Math.abs(score) * 100)}%` }} />
                </div>
                <span className={`text-xs font-mono ${score >= 0 ? 'text-green-400' : 'text-red-400'}`}>{score > 0 ? '+' : ''}{score.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
