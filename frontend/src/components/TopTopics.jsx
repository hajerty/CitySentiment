import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function getBarColor(s) { return s > 0.2 ? '#22c55e' : s < -0.2 ? '#ef4444' : '#94a3b8'; }

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl min-w-[160px]">
      <p className="text-sm font-semibold text-white capitalize mb-2">{d.topic}</p>
      <p className="text-xs text-gray-400">{d.count} menzioni</p>
      <div className="mt-1.5 space-y-0.5">
        <p className="text-xs text-green-400">+{d.positive} pos</p>
        <p className="text-xs text-red-400">-{d.negative} neg</p>
        <p className="text-xs text-gray-500">~{d.neutral} neu</p>
      </div>
      <p className="text-xs mt-1.5 font-mono" style={{ color: getBarColor(d.avg_score) }}>Score: {d.avg_score > 0 ? '+' : ''}{d.avg_score.toFixed(2)}</p>
    </div>
  );
};

export default function TopTopics({ data }) {
  if (!data?.length) return null;
  const top10 = data.slice(0, 10);
  return (
    <div className="card">
      <div className="card-title">Top Topic</div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={top10} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="topic" width={80} tick={{ fill: '#d1d5db', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v.charAt(0).toUpperCase() + v.slice(1)} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1f2937' }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {top10.map((entry, i) => <Cell key={i} fill={getBarColor(entry.avg_score)} fillOpacity={0.85} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
