import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

const COLORS = ['#3b82f6','#8b5cf6','#f59e0b','#10b981','#f97316','#ec4899','#06b6d4','#84cc16'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-2">{format(parseISO(label), 'd MMM', { locale: it })}</p>
      {payload.filter(p => p.value > 0).map(p => (
        <p key={p.dataKey} className="text-xs" style={{ color: p.color }}><span className="capitalize">{p.dataKey}</span>: <span className="font-semibold">{p.value}</span></p>
      ))}
    </div>
  );
};

export default function TopicTrends({ data, topTopics }) {
  if (!data?.length || !topTopics?.length) return null;
  const topicNames = topTopics.slice(0, 8).map(t => t.topic);
  return (
    <div className="card">
      <div className="card-title">Trend Topic nel Tempo</div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => format(parseISO(v), 'd/MM')} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-gray-400 capitalize">{v}</span>} />
          {topicNames.map((topic, i) => (
            <Line key={topic} type="monotone" dataKey={topic} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
