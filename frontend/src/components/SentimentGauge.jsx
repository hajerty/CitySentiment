import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = { positive: '#22c55e', negative: '#ef4444', neutral: '#94a3b8' };
const LABELS = { positive: 'Positivo', negative: 'Negativo', neutral: 'Neutro' };

export default function SentimentGauge({ sentiment }) {
  if (!sentiment) return null;
  const { total, positive, negative, neutral, avg_score } = sentiment;
  const data = [{ name: 'positive', value: positive }, { name: 'negative', value: negative }, { name: 'neutral', value: neutral }].filter(d => d.value > 0);
  const pct = v => total > 0 ? Math.round((v / total) * 100) : 0;
  const scoreLabel = avg_score > 0.2 ? 'Positivo' : avg_score < -0.2 ? 'Negativo' : 'Neutro';
  const scoreColor = avg_score > 0.2 ? 'text-green-400' : avg_score < -0.2 ? 'text-red-400' : 'text-gray-400';
  return (
    <div className="card">
      <div className="card-title">Sentiment Generale</div>
      <div className="flex items-center gap-4">
        <div className="w-36 h-36 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={42} outerRadius={60} paddingAngle={2} dataKey="value">
                {data.map(entry => <Cell key={entry.name} fill={COLORS[entry.name]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} formatter={(v, name) => [`${pct(v)}%`, LABELS[name]]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {[{ key: 'positive', value: positive, color: 'bg-green-500' }, { key: 'negative', value: negative, color: 'bg-red-500' }, { key: 'neutral', value: neutral, color: 'bg-gray-500' }].map(({ key, value, color }) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
              <span className="text-xs text-gray-400 w-16">{LABELS[key]}</span>
              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct(value)}%` }} />
              </div>
              <span className="text-xs font-mono text-gray-300 w-8 text-right">{pct(value)}%</span>
            </div>
          ))}
          <div className="pt-2 border-t border-gray-800">
            <p className="text-xs text-gray-500">{total.toLocaleString('it-IT')} contenuti analizzati</p>
            <p className={`text-sm font-semibold mt-1 ${scoreColor}`}>Score medio: {avg_score > 0 ? '+' : ''}{avg_score.toFixed(2)} — {scoreLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
