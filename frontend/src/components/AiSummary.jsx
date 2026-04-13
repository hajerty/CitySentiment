import React from 'react';
import { Sparkles } from 'lucide-react';

export default function AiSummary({ summary, cityName }) {
  if (!summary) return null;
  return (
    <div className="card border-blue-800/50 bg-blue-950/20">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={14} className="text-blue-400" />
        <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Analisi AI — {cityName}</span>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed">{summary}</p>
    </div>
  );
}
