import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-2">{format(parseISO(label), 'd MMM', { locale: it })}</p>
      {payload.map(p => <p key={p.dataKey} className="text-xs" style={{ color: p.color }}>{p.name}: <span className="font-semibold">{p.value}</span></p>)}
    </div>
  );
};

export default function SentimentTimeline({ data }) {
  if (!data?.length) return null;
  const formatted = data.map(d => ({ ...d, label: format(parseISO(d.date), 'd/MM') }));
  return (
    <div className="card">
      <div className="card-title">Andamento Sentiment nel Tempo</div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradPositive" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
            <linearGradient id="gradNegative" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
            <linearGradient id="gradNeutral" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} /><stop offset="95%" stopColor="#94a3b8" stopOpacity={0} /></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-gray-400">{v}</span>} />
          <Area type="monotone" dataKey="positive" name="Positivo" stroke="#22c55e" fill="url(#gradPositive)" strokeWidth={2} />
          <Area type="monotone" dataKey="negative" name="Negativo" stroke="#ef4444" fill="url(#gradNegative)" strokeWidth={2} />
          <Area type="monotone" dataKey="neutral" name="Neutro" stroke="#94a3b8" fill="url(#gradNeutral)" strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
