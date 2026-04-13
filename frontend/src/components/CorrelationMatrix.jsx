import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs font-semibold text-white capitalize mb-1">{label}</p>
      {payload.map(p => <p key={p.dataKey} className="text-xs" style={{ color: p.fill }}>{p.name}: <span className="font-semibold">{p.value}</span></p>)}
    </div>
  );
};

export default function CorrelationMatrix({ data }) {
  if (!data?.length) return null;
  const top8 = data.slice(0, 8).map(d => ({ ...d, topic: d.topic.charAt(0).toUpperCase() + d.topic.slice(1) }));
  return (
    <div className="card">
      <div className="card-title">Correlazione Topic × Fonte</div>
      <p className="text-xs text-gray-500 mb-3">Distribuzione delle menzioni per topic tra social, notizie e canali ufficiali</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={top8} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="topic" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={45} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1f2937' }} />
          <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-gray-400">{v}</span>} />
          <Bar dataKey="social" name="Social" fill="#3b82f6" radius={[2, 2, 0, 0]} />
          <Bar dataKey="news" name="Notizie" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
          <Bar dataKey="official" name="Ufficiale" fill="#f59e0b" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
